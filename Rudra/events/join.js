module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.0.0",
    credits: "Pix SMP",
    description: "Silent join event"
};

module.exports.run = async function ({ api, event }) {

    const { threadID, logMessageData } = event;

    const addedParticipants =
        logMessageData?.addedParticipants || [];

    const botID =
        api.getCurrentUserID();

    // ========================================
    // BOT WAS ADDED
    // ========================================

    if (
        addedParticipants.some(
            user => user.userFbId == botID
        )
    ) {

        // Keep bot nickname
        try {

            api.changeNickname(
                `𝗕𝗢𝗧 ${global.config.BOTNAME} 【 ${global.config.PREFIX} 】`,
                threadID,
                botID
            );

        } catch (error) {

            console.log(
                "Failed to change bot nickname:",
                error.message
            );

        }

        // SILENT
        return;
    }


    // ========================================
    // SOMEONE JOINED
    // ========================================

    // Do nothing.
    // No message
    // No image
    // No mention
    // No API request

    return;
};
