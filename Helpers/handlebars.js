const Handlebars = require("handlebars");

// Helper to format dates
Handlebars.registerHelper("formatDate", function (date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
});

// Export Handlebars so it can be used in app.js
module.exports = Handlebars;
