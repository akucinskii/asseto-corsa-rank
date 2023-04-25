const fs = require("fs");
const { Input } = require("enquirer");
require("dotenv").config();

const filename = process.env.PATH_TO_RACE_OUT;
const json_database = "data.json";

let name;
let bestTime;
let newLeaderboard = [];
let currentTrack;

const askName = new Input({
  name: "name",
  message: "What is your name?",
});
askName.run().then((answer) => {
  console.log("Your name is: " + answer);
  name = answer;
  console.log("Start your race in Assetto Corsa!");
});

if (!fs.existsSync(json_database)) {
  console.log("Creating new database");
  fs.writeFileSync(
    json_database,
    JSON.stringify({
      leaderboard: [],
    })
  );
}

// read file
const data = fs.readFileSync(json_database, "utf8");
const database = JSON.parse(data);

fs.watch(filename, { encoding: "buffer" }, (eventType, filename) => {
  if (eventType === "change") {
    save();
  }
});

const save = () => {
  fs.readFile(filename, "utf8", (err, data) => {
    //   if (err) throw err;

    try {
      const json = JSON.parse(data);
      currentTrack = json.track;

      const time = String(json.sessions[0].bestLaps[0].time);

      const objectToWrite = {
        name: name || "Unknown",
        time: time,
        car: json.players[0].car,
        date: new Date().toDateString() + " " + new Date().toLocaleTimeString(),
      };

      const matchingEntry = database.leaderboard.find(
        (entry) => entry.date === objectToWrite.date
      );

      if (!matchingEntry) {
        newLeaderboard = [
          ...database.leaderboard,
          {
            name: name || "Unknown",
            time: time,
            car: json.players[0].car,
            date: new Date().toLocaleString(),
            map: json.track,
          },
        ];
        fs.writeFileSync(
          json_database,
          JSON.stringify({
            leaderboard: newLeaderboard,
          })
        );
        newLeaderboard
          .filter((entry) => entry.map === currentTrack)
          .sort((a, b) => a.time - b.time)
          .map(
            (entry) =>
              entry.name +
              ": " +
              transformTime(entry.time) +
              " car: " +
              entry.car
          )
          .map((entry, index) => index + 1 + ". " + entry)
          .slice(0, 10)
          .forEach((entry) => console.log(entry));

        console.log("");
        console.log("Your best time for this session: " + transformTime(time));
      } else {
        console.log("Already in database");
      }

      bestTime = transformTime(time);
    } catch (err) {
      console.error(`Error parsing JSON in file ${filename}: ${err.message}`);
    }
  });
};

const transformTime = (propTime) => {
  const time = String(propTime);
  const totalSeconds = time.substring(0, time.length - 3);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;

  let timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const miliseconds = time.substring(time.length - 3, time.length);

  InnerBestTime = timeString + ":" + miliseconds;

  return InnerBestTime;
};
