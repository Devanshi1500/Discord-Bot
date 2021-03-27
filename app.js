const Discord = require("discord.js");
const fs = require("fs");
const express = require('express');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json())

require("dotenv").config();

const client = new Discord.Client();
const prefix = process.env.PREFIX;

client.commands = new Discord.Collection();
client.login(process.env.DISCORD_BOT_TOKEN);

let channel;

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.on('ready', async () => {
    console.log("Bot is ready");
    channel = await client.channels.fetch(process.env.CHANNEL_ID);
})

client.on('message', (msg) => {
    // ignore if a bot sends the message
    if (msg.author.bot || !msg.content.startsWith(prefix)) return;

    args = msg.content.slice(prefix.length).trim().split(/ +/);
    command = args.shift().toLowerCase();

    if (!client.commands.get(command)) {
      return msg.reply("No such command found");
    }

    command = client.commands.get(command);

    try {
      command.execute(msg, args);
    } catch (error) {
      console.log(error);
      return msg.channel.send("There was an error executing the command");
    }
});

client.on("githubMessage", (msg) => {
  if (msg.action === "opened") {
      const issue = msg.issue;
      const embed = "New issue created: " + issue.html_url;
      channel.send(embed);
  } else {
      // We don't do that here;
      return;
  }

});

app.post("/github", (req, res) => {
  client.emit('githubMessage', req.body)
  return res.status(200).json({success: true})
})

const port = process.env.POST || 8081;
app.listen(port, () => {
  console.log("Server up to date on port", port)
})