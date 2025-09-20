// --- SEARCH ---
let currentSearchTerm = "";
function setupSearch() {
    const searchInput = document.getElementById("kill-search");
    const noMessagesFound = document.getElementById("no-messages-found");

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const messages = document.querySelectorAll(".message-container");

        let found = false;

        messages.forEach((message) => {
            const sender = message.querySelector(".sender");
            const messageText = message.querySelector(".message-text");

            // If search is empty, restore original text without the highlight spans
            if (!searchTerm) {
                // Just setting the text content will remove all HTML tags
                sender.textContent = sender.textContent;
                messageText.textContent = messageText.textContent;
                message.style.display = "flex";
                found = true;
            } else if (sender.textContent.toLowerCase().includes(searchTerm) || 
                       messageText.textContent.toLowerCase().includes(searchTerm)) {

                message.style.display = "flex";
                found = true;

                highlightText(sender, searchTerm);
                highlightText(messageText, searchTerm);
            } else {
                message.style.display = "none";
            }
        });
        currentSearchTerm = searchTerm;

        noMessagesFound.style.display = found ? "none" : "block";

        scrollToBottom();
    });
}
window.addEventListener("load", setupSearch);

function highlightText(element, searchTerm) {
    const originalText = element.textContent;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const highlightedHTML = originalText.replace(regex, '<span class="highlight">$1</span>');

    element.innerHTML = highlightedHTML;
}



// --- SCROLLING ---
let autoScrollEnabled = true;
function scrollToBottom() {
    const killFeed = document.querySelector(".kill-feed");
    killFeed.scrollTop = killFeed.scrollHeight;
}

function handleScroll() {
    const killFeed = document.querySelector(".kill-feed");
    const scrollToBottomButton = document.getElementById("scroll-to-bottom");

    if (!killFeed) return;

    const isAtBottom = Math.abs(killFeed.scrollHeight - killFeed.scrollTop - killFeed.clientHeight) < 5;

    if (isAtBottom) {
        autoScrollEnabled = true;
        if (scrollToBottomButton) {
            scrollToBottomButton.style.display = "none";
        }
    } else {
        autoScrollEnabled = false;
        if (scrollToBottomButton) {
            scrollToBottomButton.style.display = "block";
        }
    }
}

function setupScrollBehavior() {
    const killFeed = document.querySelector(".kill-feed");

    if (killFeed) {
        killFeed.addEventListener("scroll", handleScroll);
    }
}

window.addEventListener("load", () => {
    setupScrollBehavior();
});



// --- HELPERS ---
const updateRate = 10_000;

class Kill {
    constructor(id, killer_uuid, killer_name, victim_uuid, victim_name, death_message, weapon_json, timestamp  ) {
        /** @type {number} */
        this.id = id;
        /** @type {string} */
        this.killer_uuid = killer_uuid;
        /** @type {string} */
        this.killer_name = killer_name;
        /** @type {string} */
        this.victim_uuid = victim_uuid;
        /** @type {string} */
        this.victim_name = victim_name;
        /** @type {string} */
        this.death_message = death_message;
        /** @type {json} */
        this.weapon_json = weapon_json;
        /** @type {number} */
        this.epoch_timestamp = timestamp;
        /** @type {string} */
        this.formatted_timestamp = formatEpochTime(timestamp);

        this.killer_skin_obj = getPlayerSkin(killer_uuid);
        this.victim_skin_obj = getPlayerSkin(victim_uuid);
        // not implemented yet this.weapon_img = getWeaponImgObj(weapon_json);
    }
}

function getPlayerSkin(uuid) {
    const playerSkin = document.createElement("img");
    playerSkin.className = "player-skin";
    playerSkin.src = "/api/player_skin/" + uuid;

    return playerSkin;
}

function formatEpochTime(epochTime) {
    const now = Date.now();
    const diffInMs = now - epochTime;
    const diffInSeconds = Math.floor(diffInMs / 1000);

    if (diffInSeconds < 60) {
        return "Now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h`;
    }

    const date = new Date(epochTime);
    return date.toISOString().split("T")[0];
}

// function onLoadAddFakeMessages() {   // Takes a while to populate the cards, so add some placeholders on page load
//     const messageFeed = document.querySelector(".kill-feed");

//     // Message container
//     const fakeMessage = document.createElement("div");
//     fakeMessage.style.display = "flex";
//     fakeMessage.className = "message-container";

//     // Info container
//     const fakeMessageInfo = document.createElement("div");
//     fakeMessageInfo.className = "message-info";
//     fakeMessageInfo.setAttribute("data-message-type", "kill");
//     fakeMessage.appendChild(fakeMessageInfo);

//     // Sender
//     const fakeSender = document.createElement("div");
//     fakeSender.className = "sender";
//     fakeSender.innerHTML = "⠀⠀⠀⠀⠀⠀";
//     fakeMessageInfo.appendChild(fakeSender);

//     // PFP
//     const fakeProfilePic = document.createElement("img");
//     fakeProfilePic.className = "profile-pic";

//     fakeProfilePic.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect width='20' height='20' fill='grey'/%3E%3C/svg%3E";
//     fakeMessageInfo.appendChild(fakeProfilePic);

//     // Message text
//     const fakeMessageText = document.createElement("div");
//     fakeMessageText.className = "message-text";
//     fakeMessageText.innerHTML = "⠀";
//     fakeMessage.appendChild(fakeMessageText);


//     for (let i = 0; i < 50; i++) {
//         messageFeed.appendChild(fakeMessage.cloneNode(true));
//     }

//     scrollToBottom();
// }
// onLoadAddFakeMessages();



// --- MESSAGE UPDATES ---
function addKill(killObj) {
    const killFeed = document.getElementsByClassName("kill-feed");  // Main kill container

    // Create the main kill container
    let killContainer = document.createElement("div");
    killContainer.className = "kill-container";
    killContainer.id = killObj.id;

    // Create kill div
    // Horrible name. It only contains the skins and weapon img.
    let displayKillDiv = document.createElement("div");
    displayKillDiv.className = "kill";

    const killerSkin = killObj.killer_skin_obj;
    killerSkin.className = "player-skin killer-skin";
    displayKillDiv.appendChild(killerSkin);

    //const weaponImg = killObj.weapon_img;  // Not implemented yet
    const weaponImg = document.createElement("img");
    weaponImg.className = "weapon-img";
    weaponImg.src = "imgs/enchanted_netherite_sword.gif";  // Placeholder until we implement weapon
    displayKillDiv.appendChild(weaponImg);
    // can we pull the image from the MC wiki? are the file names standardized?

    const victimSkin = killObj.victim_skin_obj
    killerSkin.className = "player-skin victim-skin";
    displayKillDiv.appendChild(victimSkin);
    
    // Add kill to main container
    killContainer.appendChild(displayKillDiv);





    // Create kill info div
    let killInfoDiv = document.createElement("div");
    killInfoDiv.className = "kill-info";

    // Death message
    const killText = document.createElement("div");
    killText.className = "kill-text";
    killText.innerHTML = killObj.death_message;
    killInfoDiv.appendChild(killText);

    // Add timestamp
    let timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.innerHTML = killObj.formatted_timestamp;
    timestamp.title = new Date(killObj.epoch_timestamp).toLocaleString();
    timestamp.setAttribute("data-epoch-timestamp", killObj.epoch_timestamp); // For updating timestamps later
    killInfoDiv.appendChild(timestamp);

    // Add kill info to main container
    killContainer.appendChild(killInfoDiv);



    // Package up the kill info
    // const killContainer = document.createElement("div");
    // killContainer.className = "kill-container";
    // killContainer.id = killObj.id;

    // if (currentSearchTerm !== "") {
    //     killContainer.style.display = "none";
    // } else {
    //     killContainer.style.display = "flex";
    // }

    // // Add the elements to the container
    // killContainer.appendChild(displayKillDiv);

    

    // NOTE: if we add the ability to fetch older messages, we can't just append to the top
    killFeed[0].appendChild(killContainer);


    if (autoScrollEnabled) {
        scrollToBottom();
    }
}

let firstLoad = true;
function getNewKills() {
    const processKills = (kills) => {
        for (const kill of kills) {
            addKill(new Kill(
                kill.id, 

                kill.killer_uuid,
                kill.killer_name,

                kill.victim_uuid,
                kill.victim_name,

                kill.death_message,
                kill.weapon_json,

                kill.timestamp
            ));
        }
    };

    if (firstLoad) {    // First load, get all kills (100 newest from API)
        fetch("/api/kill_history")
            .then(response => response.json())
            .then(data => {
                // Removes the placeholder kills, while keeping the "No kills found" message
                const killFeed = document.querySelector(".kill-feed");
                killFeed.querySelectorAll(".kill-container").forEach(el => el.remove());

                processKills(data);
                firstLoad = false;
            });
    } else {    // Standard update, get kills newer than the most recent kill  (limited to 50 kills) 
        const kills = document.getElementsByClassName("kill-container");
        const newestKillID = kills[kills.length - 1]?.id;

        fetch(`/api/kill_history?newest_kill_id=${newestKillID}`)
            .then(response => response.json())
            .then(data => {
                processKills(data);
            });
    }
}
getNewKills();
setInterval(getNewKills, updateRate);

function updateMessageTimestamps() {
    // Once messages are added, their timestamps are not magically updated.
    // This fixes that. 
    // Could we maybe just attach an event to the timestamp divs instead?

    const formattedTimestamps = document.getElementsByClassName("timestamp");

    for (const timestamp of formattedTimestamps) {
        const epochTimestampString = timestamp.getAttribute("data-epoch-timestamp");
        const epochTimestamp = Number(epochTimestampString);
        timestamp.innerHTML = formatEpochTime(epochTimestamp);
    }
}
setInterval(updateMessageTimestamps, 30_000);



// --- MISC. UPDATES ---
function updateInfoBubbles() {
    const killsCount = document.getElementById("kills-count");
    const uniqueKillers = document.getElementById("unique-killers");
    const uniqueVictims = document.getElementById("unique-victims");

    fetch("/api/kills_misc")
        .then(response => response.json())
        .then(data => {
            killsCount.innerHTML = data.total_kills.toString();
            uniqueKillers.innerHTML = data.unique_killers.toString();
            uniqueVictims.innerHTML = data.unique_victims.toString();
        });
    
}
updateInfoBubbles();
setInterval(updateInfoBubbles, updateRate);
