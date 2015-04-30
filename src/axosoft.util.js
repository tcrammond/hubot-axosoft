module.exports = {

    /**
     * Returns the given string formatted with "markdown" bold characters
     *
     * @param {string} string The string to boldify
     * @param {boolean} nl (Optional) Whether to add a newline to the end of the string
     * @returns {string} Formatted string
     */
    bold: function (string, nl) {

        nl = nl || false;
        // Turned off for now as this was assuming Slack is being used
        //return '*' + string + '*' + (nl === true ? '\n' : '');
        return string + (nl === true ? '\n' : '');

    },

    /**
     * Returns minutes converted to hours
     * @param {number} minutes Number of minutes
     * @param {boolean} addUnit Whether to add the units to the end of the string
     * @returns {string} Converted string
     */
    minsToHours: function (minutes, addUnit) {

        return (minutes / 60).toFixed(2) + (addUnit ? 'hr' : '');

    },

    getIdByName: function (name, projects) {

        projects = projects || {};

        for (var project in projects) {
            if(project.toLowerCase() === name.toLowerCase()) {
                return projects[project];
            }
        }

        return null;

    }
};