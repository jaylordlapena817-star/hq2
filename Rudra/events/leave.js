module.exports.config = {
    name: "leaveNoti",
    eventType: ["log:unsubscribe"],
    version: "2.0.0",
    credits: "Pix SMP",
    description: "Silent leave event"
};

module.exports.run = async function ({ api, event }) {

    // ========================================
    // SILENT LEAVE EVENT
    // ========================================

    // Do nothing when someone leaves
    // Do nothing when someone is kicked
    // No message
    // No image
    // No mention
    // No API request

    return;
};
