// Description:
//   A hubot script that helps you quickly grab data from Axosoft, an agile project management solution.
//
// Commands:
//   hubot axosoft authenticate - Returns an Axosoft URL where you can authenticate the app with your account.
//   hubot axosoft setup - Performs some behind-the-scenes setup, such as store a list of your projects. You can re-run
// this at any time to get fresh data. hubot axosoft work logs from <day> - Lists work logs submitted on the given day,
// grouped by user and item. hubot axosoft add bug "<title"> to <project> - Adds a new bug to the specified project.
// hubot axosoft bug <id> - Returns some information about the bug with the given ID. hubot axosoft add feature
// "<title"> to <project> - Adds a new feature to the specified project. hubot axosoft feature <id> - Returns some
// information about the feature with the given ID.  Author: tcrammond

var moment = require('moment');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var util = require('./axosoft.util.js');
var q = require('q');
var validUrl = require('valid-url');
//var Responders = require('./responders.js');

var configFileName = './axosoft.util.js';
var configFilePath = path.resolve(__dirname + '/../axosoft.config.json');

//var Responders = (function() {
    function Responders(robot) {
        this.robot = robot;
        this.robot.brain.data.responders = [];
        this.robot.brain.on('loaded', (function(_this) {
            return function(data) {
                var pattern, ref, responder, results;
                ref = data.responders;
                results = [];
                for (pattern in ref) {
                    responder = ref[pattern];
                    delete responder.index;
                    results.push(_this.add(pattern, responder.callback));
                }
                return results;
            };
        })(this));
    }

    Responders.prototype.responders = function() {
        //console.log(this.robot.brain.data.responders);
        return this.robot.brain.data.responders;
    };

    Responders.prototype.responder = function(pattern) {
        return this.responders()[pattern];
    };

    Responders.prototype.remove = function(pattern) {
        var responder;
        responder = this.responder(pattern);
        if (responder) {
            if (responder.index) {
                console.log("listenrs before", this.robot.listeners);
                this.robot.listeners.splice(responder.index, 1);
                console.log("listenrs after", this.robot.listeners);

            }
            delete this.responders()[pattern];
        } else {
            console.log("COULD NOT FIND RESPONDER", pattern);
        }
        return responder;
    };

    Responders.prototype.add = function(pattern, callback) {
        var error, eval_callback, eval_pattern;
        try {
            eval_pattern = eval("/" + pattern + "/i");
        } catch (_error) {
            console.log("ERROR WITH PATTERN");
            error = _error;
            eval_pattern = null;
        }
        //try {
        //    eval_callback = eval("_ = function (msg) { " + callback + " }");
        //} catch (_error) {
        //    console.log("ERROR WITH FUNCTION");
        //    error = _error;
        //    eval_callback = null;
        //}

        eval_callback = callback;

        if (eval_pattern instanceof RegExp && eval_callback instanceof Function) {
            this.remove(pattern);
            this.robot.respond(eval_pattern, eval_callback);
            this.responders()[pattern] = {
                callback: callback,
                index: this.robot.listeners.length - 1
            };
            return this.responder(pattern);
        }
    };

    //return Responders;

//})();

module.exports = function (robot) {

    var responders = new Responders(robot);

    /*
     Internal constants
     */
    var CLIENT_ID = '4256eb0f-b094-40b3-b249-ddeb830169c6';
    var AUTH_SERVER = 'https://shielded-refuge-9845.herokuapp.com';

    /**
     * Config
     */
    var CONFIG = _.merge({
        API_VERSION: "/api/v5",
        AXOSOFT_URL: "",
        DATE_FORMAT: 'YYYY-MM-DD',
        ACCESS_TOKEN: "",
        ITEM_NAMES: {
            defects: {
                tab: "Defects",
                singular: "Defect",
                plural: "Defects"
            },
            features: {
                tab: "Features",
                singular: "Feature",
                plural: "Features"
            },
            tasks: {
                tab: "Tasks",
                singular: "Task",
                plural: "Tasks"
            },
            incidents: {
                tab: "Incidents",
                singular: "Incident",
                plural: "Incidents"
            },
            work_logs: {
                tab: "Work Logs",
                singular: "Work log",
                plural: "Work logs"
            }
        }
    }, JSON.parse(fs.readFileSync(configFilePath, 'utf8')));

    /*
     API info
     */
    var API_URL = '';
    var API = {};
    var setupApi = function () {
        API_URL = CONFIG.AXOSOFT_URL + CONFIG.API_VERSION;
        API = {
            AUTH: CONFIG.AXOSOFT_URL + '/auth',
            WORK_LOGS: API_URL + '/work_logs',
            PROJECTS: API_URL + '/projects',
            DEFECTS: API_URL + '/defects',
            FEATURES: API_URL + '/features',
            SYSTEM_OPTIONS: API_URL + '/settings/system_options'
        };
    };

    /*
     Hubot responders.
     We set these up / tear them down as and when the setup command is used
     */
    var matchers = {};
    var setupMatchers = function () {

        console.log("before matchers", CONFIG.ITEM_NAMES);
        matchers = {
            projects: 'axosoft projects',
            project: 'axosoft project (.*)',
            workLogsReport: 'axosoft ' + CONFIG.ITEM_NAMES.work_logs.plural.toLowerCase() + ' from (.*)( to (.*))?',
            feature: 'axosoft ' + CONFIG.ITEM_NAMES.features.singular.toLowerCase() + ' (.*)',
            bug: 'axosoft ' + CONFIG.ITEM_NAMES.defects.singular.toLowerCase() + ' (.*)',
            addFeature: 'axosoft add ' + CONFIG.ITEM_NAMES.features.singular.toLowerCase() + ' "(.*)" to (.*)',
            addBug: 'axosoft add ' + CONFIG.ITEM_NAMES.defects.singular.toLowerCase() + ' "(.*)" to (.*)'
        };
        console.log("after matchers");


    };

    var forgetResponders = function () {


        for (var key in matchers) {
            responders.remove(matchers[key]);
            //robot.forget(matchers[key]);
        }

    };

    var setupResponders = function () {

        /*
         WORK LOGS
         */
        responders.add(matchers.workLogsReport, function (msg) {

            //TODO: rewrite this properly

            if (!authenticated(msg)) return;

            var fromDate,
                toDate,
                processedLogs;

            fromDate = msg.match[1];

            switch (fromDate.toLowerCase()) {
                case 'yesterday':
                    fromDate = moment().subtract(1, 'days').format(CONFIG.DATE_FORMAT);
                    break;

                case 'today':
                    fromDate = moment().format(CONFIG.DATE_FORMAT);
                    break;

                case 'tomorrow':
                    msg.send('That\'s for me to know and you to find out.');
                    return;
                case 'monday':
                case 'tuesday':
                case 'wednesday':
                case 'thursday':
                case 'friday':
                case 'saturday':
                case 'sunday':
                    fromDate = getPrevWeekday(fromDate);
                    break;

                default:
                    fromDate = moment(fromDate).format(CONFIG.DATE_FORMAT);
                    break;
            }

            toDate = moment(fromDate).add(1, 'days').format(CONFIG.DATE_FORMAT);

            processedLogs = {};

            var processLogUser = function (log) {

                processedLogs[log.user.name] = processedLogs[log.user.name] || {
                        items: [],
                        totalDuration: 0
                    };

                processedLogs[log.user.name].items.push({
                    duration: log.work_done.duration,
                    id: log.item.id,
                    name: log.item.name,
                    type: log.item.item_type
                });

            };

            var processLogs = function () {

                for (var prop in processedLogs) {
                    var user = processedLogs[prop];
                    var newLogs = {};
                    var total = 0;

                    for (var i = 0; i < user.items.length; i++) {

                        var log = user.items[i];

                        newLogs[log.id] = newLogs[log.id] || {
                                duration: 0,
                                id: log.id,
                                name: log.name,
                                type: log.item_type
                            };

                        newLogs[log.id].duration += log.duration;
                        total += log.duration;

                    }

                    processedLogs[prop].items = newLogs;
                    processedLogs[prop].totalDuration = total;

                }

            };

            robot.http(API.WORK_LOGS + '?start_date=' + fromDate + '&end_date=' + toDate + '&access_token=' + CONFIG.ACCESS_TOKEN).get()(function (err, res, body) {
                body = JSON.parse(body);
                for (var i = 0; i < body.data.length; i++) {
                    processLogUser(body.data[i]);
                }
                processLogs();

                if (!body.data.length) {
                    msg.send('Sorry, there aren\'t any work logs for ' + fromDate + '.');
                    return;
                }

                var message = util.bold('Work from ' + fromDate, true);
                var grandTotal = 0;

                for (var user in processedLogs) {

                    // Title
                    message += util.bold(user + ':', true);

                    // Items
                    for (var itemId in processedLogs[user].items) {
                        var item = processedLogs[user].items[itemId];
                        message += util.bold('[' + item.id + ']') + ' ' + item.name + ' - ' + util.minsToHours(item.duration, true) + '\n';
                    }

                    // Total
                    message += util.bold('Velocity:') + ' ' + util.minsToHours(processedLogs[user].totalDuration, true);
                    grandTotal += processedLogs[user].totalDuration;

                    message += '\n\n';
                }

                message += util.bold('Total:') + ' ' + util.minsToHours(grandTotal, true);

                msg.send(message);
            });
        });

        /*
         * Lists all of the projects and their ID for aliasing
         */
        responders.add(matchers.projects, function (msg) {

            if (!authenticated(msg)) return;

            var projects = robot.brain.get('projectIndex');

            if (projects) {

                for (project in projects) {
                    msg.send('Name: ' + project + ' , ID: ' + projects[project]);
                }

            } else {

                msg.send('Oops, I don\'t know any projects. Try running "hubot axosoft setup" to help me remember them.');

            }

        });

        //TODO: make this do something useful!
        responders.add(matchers.project, function (msg) {

            if (!authenticated(msg)) return;

            // Check a project name was actually given
            if (!msg.match[1] || msg.match[1] === '') {
                msg.send('Please supply a project name.');
                return;
            }

            // Make the project easier to match & try to find it
            var match = msg.match[1].toLowerCase();
            var projects = robot.brain.get('projectIndex');
            var id = util.getIdByName(match, projects);

            // If it couldn't be found we'll say so.
            msg.send(id !== null ? 'All I know about ' + match + ' is that it\'s ID is ' + id + '! I promise I\'ll be more useful one day.' :
                'Sorry, I don\'t know anything about that project. Try running "hubot axosoft setup".');

        });

        responders.add(matchers.feature, function (msg) {

            getFeature(msg.match[1]).then(function (data) {
                var projects = robot.brain.get('projectIndex');
                var projectName = getNameById(data.data.project.id, projects);

                msg.send('Feature "' + msg.match[1] + '" is "' + data.data.name + '" in project "' + projectName + '"');
                msg.send(CONFIG.AXOSOFT_URL + '/viewitem.aspx?id=' + msg.match[1] + '&type=features');
            }, function (error) {
                var response = handleApiError(msg, error);
                msg.send(response);
            });

        });

        responders.add(matchers.bug, function (msg) {

            getDefect(msg.match[1]).then(function (data) {
                var projects = robot.brain.get('projectIndex');
                var projectName = getNameById(data.data.project.id, projects);

                msg.send('Bug "' + msg.match[1] + '" is "' + data.data.name + '" in project "' + projectName + '"');
                msg.send(CONFIG.AXOSOFT_URL + '/viewitem.aspx?id=' + msg.match[1] + '&type=defects');
            }, function (error) {
                var response = handleApiError(msg, error);
                msg.send(response);
            });

        });

        responders.add(matchers.addBug, function (msg) {

            var title = msg.match[1];
            var project = msg.match[2];

            createDefect(title, project).then(function (data) {
                msg.send('The bug has been created with an ID of ' + data.id + '.');
            }, function (error) {
                msg.send('Sorry, something went wrong creating the bug. ' + error);
            });

        });

        responders.add(matchers.addFeature, function (msg) {

            var title = msg.match[1];
            var project = msg.match[2];

            createFeature(title, project).then(function (data) {
                msg.send('The feature has been created with an ID of ' + data.id + '.');
            }, function (error) {
                msg.send('Sorry, something went wrong creating the feature. ' + error);
            });

        });
    };

    setupApi();
    setupMatchers();
    setupResponders();
    console.log("Initial responders", responders.responders());

    /**
     * Returns the full URL the user must visit to authenticate the app
     * @returns {string|boolean} URL or false on error
     */
    var getAuthenticateUrl = function () {
        if (!CONFIG.AXOSOFT_URL || CONFIG.AXOSOFT_URL === '') {
            return false;
        }

        return API.AUTH + '?response_type=code&client_id=' + CLIENT_ID + '&redirect_uri=' + encodeURIComponent(AUTH_SERVER) + '&scope=' +
            'read%20write&expiring=false&state=' + CONFIG.AXOSOFT_URL.replace('https://', '');
    };

    var needAccessTokenResponse = function () {
        return 'Please visit this URL to authorize me through Axosoft: \n' + getAuthenticateUrl()
    };

    /**
     * Returns the previous day of the given day from today (yes)
     * @param weekday
     * @returns {string}
     */
    var getPrevWeekday = function (weekday) {
        var today = moment();
        var day = moment().day(weekday);

        if (day > today) {
            day = day.subtract(7, 'days');
        }

        return day.format(CONFIG.DATE_FORMAT);
    };

    /*
     * Gets the projects for a company
     */

    var getProjects = function () {
        var deferred = q.defer();
        robot.http(API.PROJECTS + '?access_token=' + CONFIG.ACCESS_TOKEN).get()(function (err, res, body) {

            if (err) deferred.reject(err);
            if (body.error_description) deferred.reject(body.error_description);

            body = JSON.parse(body);
            var data = body.data;

            var projectArray = flattenProjects(data);

            deferred.resolve(projectArray);

        });

        return deferred.promise;
    };

    var getSystemOptions = function () {
        var deferred = q.defer();
        var data = {};

        robot.http(API.SYSTEM_OPTIONS + '?access_token=' + CONFIG.ACCESS_TOKEN).get()(function (err, res, body) {

            if (err) deferred.reject(err);
            if (body.error_description) deferred.reject(body.error_description);

            body = JSON.parse(body);

            data = {
                features: body.data.item_types.features.labels,
                defects: body.data.item_types.defects.labels,
                tasks: body.data.item_types.tasks.labels,
                work_logs: body.data.item_types.work_logs.labels
            };

            deferred.resolve(data);
        });

        return deferred.promise;
    };

    var createDefect = function (title, project) {
        var deferred = q.defer();

        var projects = robot.brain.get('projectIndex');
        var projectId = util.getIdByName(project, projects);

        if (projectId === null || !projectId) {
            deferred.reject('Could\'t find the project "' + project + '". Maybe try "hubot axosoft setup"?');
            return deferred.promise;
        }

        var defect = {
            notify_customer: false,
            item: {
                name: title,
                project: {
                    id: projectId
                }
            }
        };

        robot.http(API.DEFECTS + '?access_token=' + CONFIG.ACCESS_TOKEN)
            .header('Content-Type', 'application/json')
            .post(JSON.stringify(defect))(function (err, res, body) {

            body = JSON.parse(body);

            if (err) deferred.reject(err.error_description);

            if (body.error_description) deferred.reject(body.error_description);

            deferred.resolve(body.data);

        });

        return deferred.promise;
    };

    var createFeature = function (title, project) {
        var deferred = q.defer();

        var projects = robot.brain.get('projectIndex');
        var projectId = util.getIdByName(project, projects);

        if (projectId === null || !projectId) {
            deferred.reject('Could\'t find the project "' + project + '". Maybe try "hubot axosoft setup"?');
            return deferred.promise;
        }

        var feature = {
            notify_customer: false,
            item: {
                name: title,
                project: {
                    id: projectId
                }
            }
        };

        robot.http(API.FEATURES + '?access_token=' + CONFIG.ACCESS_TOKEN)
            .header('Content-Type', 'application/json')
            .post(JSON.stringify(feature))(function (err, res, body) {

            body = JSON.parse(body);

            if (err) deferred.reject(err.error_description);

            if (body.error_description) deferred.reject(body.error_description);

            deferred.resolve(body.data);

        });

        return deferred.promise;
    };

    /*
     * Flattens the list of projects to get the children out
     */
    var flattenProjects = function (projects) {

        projects = projects || [];
        var flattenedProjects = [];

        for (var i = 0; i < projects.length; i++) {
            flattenedProjects.push({name: projects[i].name, id: projects[i].id});

            if (projects[i].children) {
                flattenedProjects.push(flattenProjects(projects[i].children));
            }
        }

        return _.flatten(flattenedProjects, true);

    };

    var getFeature = function (id) {
        var deferred = q.defer();

        robot.http(API_URL + '/features/' + id + '?access_token=' + CONFIG.ACCESS_TOKEN).get()(function (err, res, body) {

            body = JSON.parse(body);

            if (err || body.error || body.error_description) {
                deferred.reject(err);
            }

            deferred.resolve(body);
        });

        return deferred.promise;
    };

    var getDefect = function (id) {
        var deferred = q.defer();

        robot.http(API_URL + '/defects/' + id + '?access_token=' + CONFIG.ACCESS_TOKEN).get()(function (err, res, body) {

            body = JSON.parse(body);

            if (err || body.error || body.error_description) {
                deferred.reject(err);
            }

            deferred.resolve(body);
        });

        return deferred.promise;
    };

    var getIdByName = function (name, projects) {

        return projects[name] || null;

    };

    var getNameById = function (id, projects) {

        var projectName = 'Unknown project';

        _.each(projects, function (project, projectIndex) {
            if (project === id) {
                projectName = projectIndex;
            }
        });

        return projectName;
    };

    var authenticated = function (msg) {
        // If the access token is not set, they must go through the authenticate procedure
        if (!CONFIG.ACCESS_TOKEN || CONFIG.ACCESS_TOKEN === '') {
            msg.send('You can\'t do that until you\'ve authenticated me. ' + needAccessTokenResponse());
            return false;
        }

        return true;
    };

    /**
     * Handles error responses from Axosoft.
     * @param {robot.message} msg The msg object that a response can be sent from hubot with
     * @param {object} error The error stuff
     */
    var handleApiError = function (msg, error) {

        return 'Oops, something went wrong. ' + error.message;

    };

    /*
     AUTHENTICATION
     */
    robot.respond(/axosoft set url (.*)/, function (msg) {
        var url = (msg.match[1] || '').trim();
        if (!url.length) {
            msg.send('Please provide a URL.');
            return;
        }

        url = url.replace('http://', '').replace('https://', '');
        url = 'https://' + url;

        if (validUrl.is_https_uri(url) === null || url.substr(-4, 4) !== '.com') {
            msg.send('Sorry, that doesn\'t look like a URL I can use. Please provide your Axosoft URL in the format myaccount.axosoft.com.');
            return;
        }

        CONFIG.AXOSOFT_URL = url;
        setupApi();

        fs.writeFile(configFilePath, JSON.stringify(CONFIG), function (err) {
            if (err) {
                msg.send('Sorry, something went wrong writing to the config file. Please check it! Error: ' + err);
            } else {
                msg.send('Successfully updated axosoft.config.json.');
            }
        });

    });

    robot.respond(/axosoft set token (.*)/, function (msg) {
        var token = (msg.match[1] || '').trim();
        if (!token.length) {
            msg.send('Invalid token.');
            return;
        }

        CONFIG.ACCESS_TOKEN = token;

        fs.writeFile(configFilePath, JSON.stringify(CONFIG), function (err) {
            if (err) {
                msg.send('Sorry, something went wrong writing to the config file. Please check it! Error: ' + err);
            } else {
                msg.send('Successfully updated axosoft.config.json.');
            }
        });

    });

    robot.respond(/axosoft authenticate/, function (msg) {
        // Send them off to Axosoft and hope for the best
        msg.send(needAccessTokenResponse());
    });

    /*
     * Stores the list of project names against their ID in the brain, so that
     * commands can reference the project name, and not the ID.
     */
    robot.respond(/axosoft setup/, function (msg) {

        if (!authenticated(msg)) return;

        var projects = getProjects();
        var sysOptions = getSystemOptions();

        /*
         Get a list of projects & store a flattened version of them
         */
        projects.then(function (data) {

            var projectIndex = {};
            _.forEach(data, function (project) {
                projectIndex[project.name] = project.id;
            });

            robot.brain.set('projectIndex', projectIndex);
        });

        /*
         Store the item names in case they have been customized
         */
        var sysOptionsData = null;
        sysOptions.then(function (data) {
            robot.brain.remove('itemNames');
            robot.brain.set('itemNames', data);
            sysOptionsData = data;
        });

        // Return only when all calls have resolved
        q.all([projects, sysOptions]).then(function () {

            forgetResponders();
            CONFIG.ITEM_NAMES = sysOptionsData;

            setupMatchers();
            setupResponders();

            console.log("responders after setup", responders.responders());

            msg.send('I\'m all set up!');
        });

    });

    robot.respond(/test/, function (msg) {
        //msg.send(JSON.stringify(responders.responders()));
msg.send(JSON.stringify(robot.listeners));

    })

};
