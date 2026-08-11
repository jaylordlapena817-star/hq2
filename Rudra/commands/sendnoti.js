module.exports.config = {
    name: "sendnoti",
    version: "2.0.2",
    hasPermssion: 2,
    credits: "IKnowYou",
    description: "Automatically sends an announcement",
    commandCategory: "Admin",
    usages: "[start/stop] [Text]",
    cooldowns: 5
};

module.exports.languages = {
    "en": {
        start: "✅ Auto notification started.",
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
// RANDOM MESSAGE ID
// ========================================

function generateMessageID() {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let result = "";

    for (let i = 0; i < 6; i++) {

        result += chars.charAt(
            Math.floor(
                Math.random() * chars.length
            )
        );

    }

    return result;
}


// ========================================
// COMMAND
// ========================================

module.exports.run = async ({
    api,
    event,
    args,
    getText
}) => {

    const action =
        args[0]?.toLowerCase();


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

        clearInterval(
            global.sendNotiInterval
        );

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


    // ========================================
    // CHECK ALREADY RUNNING
    // ========================================

    if (global.sendNotiInterval) {

        return api.sendMessage(
            getText("alreadyRunning"),
            event.threadID
        );

    }


    // ========================================
    // GET MESSAGE
    // ========================================

    const message =
        args.slice(1).join(" ");


    if (!message) {

        return api.sendMessage(
            getText("noMessage"),
            event.threadID
        );

    }


    // ========================================
    // SAVE PURE MESSAGE
    // ========================================

    global.sendNotiMessage = message;


    // ========================================
    // SEND TO ALL THREADS
    // ========================================

    const sendToAllThreads = async () => {

        const allThread =
            global.data.allThreadID || [];


        for (const idThread of allThread) {

            if (
                isNaN(parseInt(idThread)) ||
                idThread == event.threadID
            ) {
                continue;
            }


            try {

                const randomID =
                    generateMessageID();


                const finalMessage =
                    `${global.sendNotiMessage}\n\n` +
                    `[ID: ${randomID}]`;


                await new Promise(
                    (resolve) => {

                        api.sendMessage(
                            finalMessage,
                            idThread,
                            () => resolve()
                        );

                    }
                );


            } catch (error) {

                console.log(
                    `[sendnoti] Failed: ${idThread}`,
                    error
                );

            }

        }

    };


    // ========================================
    // AUTO SEND
    // ========================================

    global.sendNotiInterval =
        setInterval(
            sendToAllThreads,
            1000
        );


    // ========================================
    // CONFIRMATION
    // ========================================

    return api.sendMessage(
        getText("start"),
        event.threadID
    );

};
