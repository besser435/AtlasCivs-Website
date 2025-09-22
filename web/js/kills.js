// --- SEARCH ---
let currentSearchTerm = "";
function setupSearch() {
    const searchInput = document.getElementById("kill-search");
    const noMessagesFound = document.getElementById("no-kills-found");

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value.toLowerCase();
        const kills = document.querySelectorAll(".kill-container");

        let found = false;

        kills.forEach((message) => {
            const messageText = message.querySelector(".death-message");

            // If search is empty, restore original text without the highlight spans
            if (!searchTerm) {
                messageText.textContent = messageText.textContent;
                message.style.display = "flex";
                found = true;
            } else if (messageText.textContent.toLowerCase().includes(searchTerm)) {
                message.style.display = "flex";
                found = true;

                highlightText(messageText, searchTerm);
            } else {
                message.style.display = "none";
            }
        });
        currentSearchTerm = searchTerm;

        noMessagesFound.style.display = found ? "none" : "block";

        scrollToTop();
    });
}
window.addEventListener("load", setupSearch);

function highlightText(element, searchTerm) {
    const originalText = element.textContent;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const highlightedHTML = originalText.replace(regex, '<span class="highlight">$1</span>');

    element.innerHTML = highlightedHTML;
}


// TODO: fix scroll issue. on load its not scrolled down all of the way.


// --- SCROLLING ---
let autoScrollEnabled = true;
function scrollToTop() {
    const killFeed = document.querySelector(".kill-feed");
    killFeed.scrollTop = 0;
}

function handleScroll() {
    const killFeed = document.querySelector(".kill-feed");
    const scrollToTopButton = document.getElementById("scroll-to-top"); 

    if (!killFeed) return;

    // Check if user is near the top
    const isAtTop = killFeed.scrollTop <= 5;

    if (isAtTop) {
        autoScrollEnabled = true;
        if (scrollToTopButton) {
            scrollToTopButton.style.display = "none";
        }
    } else {
        autoScrollEnabled = false;
        if (scrollToTopButton) {
            scrollToTopButton.style.display = "block";
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
        return diffInMinutes === 1
            ? "1 minute ago"
            : `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return diffInHours === 1
            ? "1 hour ago"
            : `${diffInHours} hours ago`;
    }

    const date = new Date(epochTime);
    return date.toISOString().split("T")[0];
}

function getWeaponImgObj(weapon_json) {
    const weaponImg = document.createElement("img");
    weaponImg.className = "weapon-img";
    
    const weaponData = JSON.parse(weapon_json);

    const itemImg = `https://assets.mcasset.cloud/1.21.8/assets/minecraft/textures/item/${weaponData.type}.png`;
    // if the above is 404, try blocks. if that is also 404, use a placeholder image. 
    // if the type is air, use a more different placeholder image.

    weaponImg.src = itemImg;

    // Will use alt for tooltip later, so we make it pretty here
    weaponImg.alt = weaponData.type
        .replace(/_/g, " ")
        .split(" ")
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join(" ");

    return weaponImg;
}

// --- PLACEHOLDER KILLS ---
// function onLoadAddFakeMessages() {
//     const killFeed = document.getElementsByClassName("kill-feed");  // Main kill container

//     // Create the main kill container
//     let FakeKillContainer = document.createElement("div");
//     FakeKillContainer.className = "kill-container";
//     FakeKillContainer.id = "placeholder-kill-1";
    
//     // Create kill div
//     // Horrible name. It only contains the skins and weapon img.
//     let displayKillDiv = document.createElement("div");
//     displayKillDiv.className = "kill";

//     const killerSkin = document.createElement("img");
//     killerSkin.className = "player-skin killer-skin";
//     displayKillDiv.appendChild(killerSkin);

//     const weaponImg = document.createElement("img");
//     displayKillDiv.appendChild(weaponImg);
//     //can we pull the image from the MC wiki? are the file names standardized?

//     const victimSkin = document.createElement("img");
//     victimSkin.className = "player-skin victim-skin";
//     displayKillDiv.appendChild(victimSkin);
    
//     // Add kill to main container
//     FakeKillContainer.appendChild(displayKillDiv);


//     // Create kill info div
//     let killInfoDiv = document.createElement("div");
//     killInfoDiv.className = "kill-info";

//     // Death message
//     const deathMessage = document.createElement("h2");
//     deathMessage.className = "death-message";
//     deathMessage.innerHTML = "died";
//     killInfoDiv.appendChild(deathMessage);

//     // Add timestamp
//     let timestamp = document.createElement("p");
//     timestamp.className = "timestamp";
//     timestamp.innerHTML = "now";
//     killInfoDiv.appendChild(timestamp);

//     // Add kill info to main container
//     FakeKillContainer.appendChild(killInfoDiv);
    
    
//     for (let i = 0; i < 50; i++) {
//         killFeed[0].appendChild(FakeKillContainer.cloneNode(true));
//     }
   
//     if (autoScrollEnabled) {
//         scrollToTop();
//     }
// }
// onLoadAddFakeMessages();



// --- MESSAGE UPDATES ---

// --- KILLS ---
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

    const weaponImg = getWeaponImgObj(killObj.weapon_json);
    displayKillDiv.appendChild(weaponImg);
    // can we pull the image from the MC wiki? are the file names standardized?

    const victimSkin = killObj.victim_skin_obj
    victimSkin.className = "player-skin victim-skin";
    displayKillDiv.appendChild(victimSkin);
    
    // Add kill to main container
    killContainer.appendChild(displayKillDiv);


    // Create kill info div
    let killInfoDiv = document.createElement("div");
    killInfoDiv.className = "kill-info";

    // Death message
    const deathMessage = document.createElement("h2");
    deathMessage.className = "death-message";
    deathMessage.innerHTML = killObj.death_message;
    killInfoDiv.appendChild(deathMessage);

    // Add timestamp
    let timestamp = document.createElement("p");
    timestamp.className = "timestamp";
    timestamp.innerHTML = killObj.formatted_timestamp;
    timestamp.title = new Date(killObj.epoch_timestamp).toLocaleString();
    timestamp.setAttribute("data-epoch-timestamp", killObj.epoch_timestamp); // For updating timestamps later
    killInfoDiv.appendChild(timestamp);

    // Add kill info to main container
    killContainer.appendChild(killInfoDiv);
    
    // NOTE: if we add the ability to fetch older messages, we can't just append to the top
    killFeed[0].insertBefore(killContainer, killFeed[0].firstChild);


    if (autoScrollEnabled) {
        scrollToTop();
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
        const newestKillID = kills.length > 0 ? kills[0].id : 0;

        fetch(`/api/kill_history?newest_kill_id=${newestKillID}`)
            .then(response => response.json())
            .then(data => {
                processKills(data);
            });
    }
}
getNewKills();
setInterval(getNewKills, updateRate);



// --- CONTENT UPDATES ---
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
