module.exports.config = {
    name: "sendnoti",
    version: "3.0.0",
    hasPermssion: 2,
    credits: "Hello",
    description: "Send notification to all group chats",
    commandCategory: "Admin",
    usages: "[here/start/stop] [Text]",
    cooldowns: 5
};

module.exports.languages = {
    en: {
        here: "✅ Test notification sent to this group.",
        start: "✅ Auto notification started.",
        stop: "🛑 Auto notification stopped.",
        noRunning: "⚠️ No auto notification is currently running.",
        alreadyRunning: "⚠️ Auto notification is already running.",
        noMessage: "❌ Please provide a message."
    }
};


// ========================================
// GLOBAL STATE
// ========================================

if (!global.sendNotiInterval) {
    global.sendNotiInterval = null;
}

if (!global.sendNotiMessage) {
    global.sendNotiMessage = "";
}

if (!global.sendNotiRunning) {
    global.sendNotiRunning = false;
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
// GET ALL GROUP CHATS
// ========================================

function getAllGroupThreads(api) {

    return new Promise((resolve) => {

        try {

            api.getThreadList(
                100,
                null,
                ["INBOX"],
                (err, threads) => {

                    if (err) {

                        console.log(
                            "[sendnoti] getThreadList error:",
                            err
                        );

                        return resolve([]);
                    }


                    if (!Array.isArray(threads)) {

                        console.log(
                            "[sendnoti] Invalid thread list."
                        );

                        return resolve([]);
                    }


                    const botID =
                        String(api.getCurrentUserID());


                    const groupThreads = threads
                        .filter(thread => {

                            if (!thread) {
                                return false;
                            }


                            const threadID =
                                String(
                                    thread.threadID ||
                                    thread.id ||
                                    ""
                                );


                            if (!threadID) {
                                return false;
                            }


                            // Ignore direct messages
                            if (
                                thread.isGroup === false
                            ) {
                                return false;
                            }


                            // Some FCA versions use participantIDs
                            if (
                                Array.isArray(
                                    thread.participantIDs
                                )
                            ) {

                                return thread.participantIDs
                                    .map(id => String(id))
                                    .includes(botID);

                            }


                            return true;

                        })
                        .map(thread => {

                            return String(
                                thread.threadID ||
                                thread.id
                            );

                        });


                    // Remove duplicates
                    const uniqueThreads =
                        [...new Set(groupThreads)];


                    console.log(
                        `[sendnoti] Found ${uniqueThreads.length} group chats.`
                    );


                    resolve(uniqueThreads);

                }
            );

        } catch (error) {

            console.log(
                "[sendnoti] Failed to get group chats:",
                error
            );

            resolve([]);

        }

    });

}


// ========================================
// SEND MESSAGE
// ========================================

function sendMessage(
    api,
    message,
    threadID
) {

    return new Promise((resolve) => {

        try {

            api.sendMessage(
                message,
                threadID,
                (err) => {

                    if (err) {

                        console.log(
                            `[sendnoti] Failed: ${threadID}`,
                            err
                        );

                    } else {

                        console.log(
                            `[sendnoti] Sent: ${threadID}`
                        );

                    }

                    resolve();

                }
            );

        } catch (error) {

            console.log(
                `[sendnoti] Exception: ${threadID}`,
                error
            );

            resolve();

        }

    });

}


// ========================================
// SEND TO ALL GROUPS
// ========================================

async function sendToAllThreads(api) {

    const allThreads =
        await getAllGroupThreads(api);


    if (allThreads.length === 0) {

        console.log(
            "[sendnoti] No group chats found."
        );

        return;

    }


    let success = 0;
    let failed = 0;


    for (const threadID of allThreads) {

        if (!global.sendNotiRunning) {
            break;
        }


        const randomID =
            generateMessageID();


        const finalMessage =
            `${global.sendNotiMessage}\n\n` +
            `[ID: ${randomID}]`;


        try {

            await sendMessage(
                api,
                finalMessage,
                threadID
            );

            success++;

        } catch (error) {

            failed++;

            console.log(
                `[sendnoti] Failed: ${threadID}`,
                error
            );

        }


        // Small delay to avoid sending everything simultaneously
        await new Promise(
            resolve => setTimeout(resolve, 100)
        );

    }


    console.log(
        `[sendnoti] Finished | Success: ${success} | Failed: ${failed}`
    );

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
    // SEND HERE
    // ========================================

    if (action === "here") {

        const message =
            args.slice(1).join(" ");


        if (!message) {

            return api.sendMessage(
                getText("noMessage"),
                event.threadID
            );

        }


        const randomID =
            generateMessageID();


        const finalMessage =
            `${message}\n\n` +
            `[ID: ${randomID}]`;


        return api.sendMessage(
            finalMessage,
            event.threadID
        );

    }


    // ========================================
    // STOP
    // ========================================

    if (action === "stop") {

        if (!global.sendNotiRunning) {

            return api.sendMessage(
                getText("noRunning"),
                event.threadID
            );

        }


        global.sendNotiRunning = false;


        if (global.sendNotiInterval) {

            clearInterval(
                global.sendNotiInterval
            );

            global.sendNotiInterval = null;

        }


        global.sendNotiMessage = "";


        return api.sendMessage(
            getText("stop"),
            event.threadID
        );

    }


    // ========================================
    // INVALID ACTION
    // ========================================

    if (action !== "start") {

        return api.sendMessage(
            "Usage:\n\n" +
            "sendnoti here <message>\n" +
            "sendnoti start <message>\n" +
            "sendnoti stop",
            event.threadID
        );

    }


    // ========================================
    // CHECK RUNNING
    // ========================================

    if (global.sendNotiRunning) {

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
    // SAVE STATE
    // ========================================

    global.sendNotiMessage =
        message;

    global.sendNotiRunning =
        true;


    // ========================================
    // FIRST SEND
    // ========================================

    await sendToAllThreads(api);


    // ========================================
    // AUTO SEND
    // ========================================

    if (global.sendNotiRunning) {

        global.sendNotiInterval =
            setInterval(
                async () => {

                    if (
                        !global.sendNotiRunning
                    ) {

                        return;

                    }


                    await sendToAllThreads(api);

                },
                1000
            );

    }


    // ========================================
    // CONFIRMATION
    // ========================================

    return api.sendMessage(
        getText("start"),
        event.threadID
    );

};
