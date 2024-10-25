-- main.lua
math.randomseed(os.time())
print("Fengari Lua script is running.")

--//////////////////////////////////
--Variables
local TitleSubtextArray = {
    "This is a Sample Text!",
    "Leon is a nice* Foxxo",
    "OCON^6 Detection within {Anville Plains}",
    "Updating Anville Guild with new OCON intel...",
    "Roy is a 🦆",
    "OCON^1: Unauthorized hammock installation near Eterna Forest.",
    "Heartz Foundation reports a flood of paper planes over Nimbasa Village.",
    "OCON^3: Berries mysteriously disappearing from Midnight Forest.",
    "Warning: Friendly pillow fight detected in Crystal Lake!",
    "OCON^2: Someone built a sandcastle too close to the docks at Alnio Town.",
    "Dust storms over Dusty Savanna are now rated 2/10 – nice breeze.",
    "Anville Guild reporting: Rogue kite tangles with comms relay above Emerald Forest.",
    "Heartz Foundation: OCON^4 detection – suspiciously large duck spotted in Murkrow Swamp.",
    "Warning: Unauthorized slip 'n slide construction at Breezy Fields.",
    "OCON^7: Aggressive group picnic in progress at Starlit Hills – sandwiches confirmed.",
    "Update: ATLAS sensors recalibrated. Whitecap coastline is still beautiful.",
    "Anville Guild: Fish parade delayed in Midnight Forest. 🎣",
    "Heartz Foundation reporting minor treetop disturbance in Whitecap Village.",
    "Alert: Glow sticks are not authorized navigational aids in the Glacial Fields.",
    "OCON^5: Mischievous fox spotted distributing cookies in the Wintry Woodlands.",
    "New update: ATLAS monitoring suggests Nimbasa Village residents are currently napping.",
    "Error: Too many ducks detected in Murkrow Swamp. Population exceeds threshold.",
    "OCON^1: Overenthusiastic bard detected near Pyre Peak – music festival imminent.",
    "Update: ATLAS has classified the latest dust devils in Arid Desert as 'pet-friendly.'",
    "Heartz Foundation confirms: 0% chance of logical weather over Whitelock Camp.",
    "Warning: Unauthorized snowball arsenal located in Gleacl Fields – incoming barrage likely!",
    "OCON^8: Strange monument detected – coordinates point to Crystal Lake. Ducks involved?"
}

local currentIndex = nil

--//////////////////////////////////
--Functions

-- Function to get a random index different from the current one
local function getRandomIndex()
    local newIndex = math.random(#TitleSubtextArray)
    while newIndex == currentIndex do
        newIndex = math.random(#TitleSubtextArray)
    end
    return newIndex
end

-- Function to cycle through subtext messages
local function cycleSubtext()
    local newIndex = getRandomIndex()
    local newText = TitleSubtextArray[newIndex]
    local elementId = "logo-subtext"

    -- Call the untypeText function properly
    js.global.untypeText("untypeText", elementId, 1000)

    -- After untyping, type the new text
    js.global:setTimeout(function()
        js.global.typeText("typeText", newText, elementId, 1000)
        currentIndex = newIndex
    end, 1000)

    -- Schedule the next cycle in 10 seconds
    js.global:setTimeout(cycleSubtext, 10000)
end

--//////////////////////////////////
--Main Events

-- Initialize with a random message
currentIndex = getRandomIndex()
print("Typing new subtext...")
js.global.typeText(nil, "ATLAS - Central - Authentication order recieved. Initializing assets...", "logo-subtext", 700)

-- Start cycling after initial typing completes
js.global:setTimeout(cycleSubtext, 1000)