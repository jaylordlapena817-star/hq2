module.exports.config = {
    name: "sendnoti",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "Pix SMP",
    description: "Automatically sends an announcement every second",
    commandCategory: "Admin",
    usages: "[start/stop] [Text]",
    cooldowns: 5
};

module.exports.languages = {
    "en": {
        start: "✅ Auto notification started. Message will be sent every 1 second.",
        stop: "🛑 Auto notification stopped.",
        noRunning: "⚠️ No auto notification is currently running.",
        alreadyRunning: "⚠️ Auto notification is already running.",
        noMessage: "❌ Please provide a message."
    }
};

// ========================================
// GLOBAL AUTO SEND STATE
// ========================================

if (!global.sendNotiInterval) {
    global.sendNotiInterval = null;
}

if (!global.sendNotiMessage) {
    global.sendNotiMessage = "";
}

// ========================================
// COMMAND
// ========================================

module.exports.run = async ({ api, event, args, getText, Users }) => {

    const action = args[0]?.toLowerCase();

    // ========================================
    // STOP
    // ========================================

    if (action === "stop") {

        if (!global.sendNotiInterval) {
            return api.sendMessage(
                getText("noRunning"),
                event.threadID
            );
        }

        clearInterval(global.sendNotiInterval);
        global.sendNotiInterval = null;
        global.sendNotiMessage = "";

        return api.sendMessage(
            getText("stop"),
            event.threadID
        );
    }

    // ========================================
    // START
    // ========================================

    if (action !== "start") {
        return api.sendMessage(
            "Usage:\n\n" +
            "sendnoti start <message>\n" +
            "sendnoti stop",
            event.threadID
        );
    }

    if (global.sendNotiInterval) {
        return api.sendMessage(
            getText("alreadyRunning"),
            event.threadID
        );
    }

    const message = args.slice(1).join(" ");

    if (!message) {
        return api.sendMessage(
            getText("noMessage"),
            event.threadID
        );
    }

    const name = await Users.getNameUser(event.senderID);

    global.sendNotiMessage =
        `${message}\n\nfrom Admin: ${name}`;

    // ========================================
    // SEND FUNCTION
    // ========================================

    const sendToAllThreads = async () => {

        const allThread = global.data.allThreadID || [];

        for (const idThread of allThread) {

            if (
                isNaN(parseInt(idThread)) ||
                idThread == event.threadID
            ) {
                continue;
            }

            try {

                await new Promise((resolve) => {

                    api.sendMessage(
                        global.sendNotiMessage,
                        idThread,
                        () => resolve()
                    );

                });

            } catch (error) {
                console.log(
                    `[sendnoti] Failed: ${idThread}`,
                    error
                );
            }
        }
    };

    // ========================================
    // SEND EVERY 1 SECOND
    // ========================================

    global.sendNotiInterval = setInterval(
        sendToAllThreads,
        1000
    );

    return api.sendMessage(
        getText("start"),
        event.threadID
    );
};
