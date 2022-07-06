import Database from "st.db";
import Eris from "eris";
import express from 'express';
import { createSpinner } from "nanospinner";
import fetch from "node-fetch";
import SyncCommands from "./SyncCommands.mjs";
const app = express()
//import replit from "quick.replit"
//const config_replit_db = new replit.Database(process.env["REPLIT_DB_URL"])
const config_replit_db = new Database({ path: "./token.json", databaseInObject: true })
const config = new Database({ path: "./config.json", databaseInObject: true })
const votes_db = new Database({ path: "./votes.yml" })

export default async function () {
    console.clear()
    const spinner = createSpinner(`Bot processing by \u001b[32;1mShuruhatik#2443\u001b[0m`).start({ color: 'green' })
    const token = await config_replit_db.get(`token`).length <= 10 ? process.env.token : await config_replit_db.get(`token`)
    const bot = new Eris(token, { intents: 32767 })
    bot.connect().then(() => {
        spinner.update({ text: 'Running the bot...' })
    }).catch(async () => {
        spinner.error({ text: 'Invalid Bot Token' })
        await config_replit_db.delete(`token`)
    })
    bot.on("ready", async () => {
        await SyncCommands(bot)
        bot.editStatus(`online`, [{ name: config.get("status_bot"), type: config.get("status_type") }]);
        let bot_invite_link = `https://discord.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=applications.commands%20bot`
        spinner.success({ text: `Logged in as ${bot.user.username} (${bot.user.id})` })
        app.get('/', (r, s) => {
            s.send({ message: "Bot by Shuruhatik#2443", youtube_channel: "https://www.youtube.com/ShuruhatikYT" })
        }).post('/', async (r, s) => {
            s.send({
                message: "Bot by Shuruhatik#2443", youtube_channel: "https://www.youtube.com/ShuruhatikYT"
            })
            if (await config_replit_db.has(`uptime`) != true) {
                console.log("\u001b[32m✔ \u001b[0mUptime has been done successfully")
                await config_replit_db.set(`uptime`, true)
            }
        })
            .get("/invite", (req, res) => res.status(301).redirect(bot_invite_link))
            .listen(3000)
        console.log("\u001b[32m▣\u001b[0m \u001b[0mBot Run By \u001b[34;1mShuruhatik#2443\u001b[0m")
        console.log("\u001b[32m▣ \u001b[0m\u001b[0m\u001b[40;1m\u001b[34;1mhttps://" + process.env.REPL_ID + ".id.repl.co/invite\u001b[0m")
    })
    bot.on("interactionCreate", async (interaction) => {
        if (interaction.type == 2) {
            if (interaction.data.name == "cancel-suggestion") {
                if (!interaction.member.permissions.has("administrator")) return await interaction.createMessage({ flags: 64, content: ":x: ليس لديك صلاحيات لهذا" })
                if (!await config_replit_db.has(`suggest`)) return await interaction.createMessage({ flags: 64, content: ":x: ليست مفعلة بالفعل" })
                await config_replit_db.delete(`suggest`)
                return await interaction.createMessage({ content: "✅ تم الغاء نظام الاقتراحات بنجاح" })
            }
            if (interaction.data.name == "setup-suggestion") {
                if (!interaction.member.permissions.has("administrator")) return await interaction.createMessage({ flags: 64, content: ":x: ليس لديك صلاحيات لهذا" })
                let options = interaction.data.options;
                try {
                    let webhook;
                    if (options.some(e => e.name == "webhook") && options.find(e => e.name == "webhook").value && options.find(e => e.name == "webhook").value == true) {
                        webhook = await bot.createChannelWebhook(options.find(e => e.name == "suggest_channel").value, { name: "Bot By Shuruhatik#2443" })
                    }
                    await config_replit_db.set(`suggest`, {
                        channel_id: options.find(e => e.name == "suggest_channel").value,
                        type_of_votes: options.find(e => e.name == "type_of_votes").value,
                        comments: options.find(e => e.name == "comments").value,
                        webhook: webhook ? { id: webhook.id, token: webhook.token } : false,
                        anti_links:options.find(e => e.name == "anti_links").value,
                        line_url: options.some(e => e.name == "line_image") ? interaction.data.resolved.attachments[options.find(e => e.name == "line_image").value].url : false,
                    })
                    await interaction.createMessage({ content: "✅ تم تفعيل نظام الاقتراحات بنجاح" })
                } catch (e) {
                    console.error(e)
                    return await interaction.createMessage({ content: `:x: فشل في تفعيل الاقتراحات برجاء تاكد من صلاحياتي حتا استطيع انشاء ويب هوك داخل الروم وايضاً تاكد ان الروم مفهوش اكثر من 10ويب هوك ` })
                }
            }
        }
        if (interaction.type == 3) {
            if (interaction.data.custom_id.startsWith("suggest")) {
                let data = interaction.data.custom_id.split("_")
                if (await votes_db.has(`${data[2]}_${interaction.member.id}`)) return await interaction.createMessage({ flags: 64, content: ":x: عملت تصويت بالفعل انت للاقتراح ده" })
                await interaction.acknowledge()
                interaction.message.components[0].components[data[1] == "up" ? 0 : 1].label = +interaction.message.components[0].components[data[1] == "up" ? 0 : 1].label + 1
                await interaction.editOriginalMessage({ components: interaction.message.components })
                await votes_db.set(`${data[2]}_${interaction.member.id}`, true)
            }
        }
    })
    bot.on("error", console.log)
    bot.on("messageCreate", async (msg) => {
        if (msg.guildID && !msg.author.bot && await config_replit_db.has(`suggest`)) {
            let suggest_data = await config_replit_db.get(`suggest`)
            if (suggest_data.channel_id != msg.channel.id) return;
            await msg.delete().catch(() => { })
            if (msg.cleanContent.length <= 3 || msg.cleanContent.length >= 4096) {
                return await msg.channel.createMessage({ content: `<@!${msg.author.id}>`, embeds: [{ description: `:x: يجب أن يكون إقتراحك بين حد ادني 3 حروف وحد اقصي 4096 حرف`, color: 0xff0000 }] }).then((m) => {
                    setTimeout(async () => await m.delete().catch(() => { }), 3000)
                })
            }
            let components = suggest_data.type_of_votes == 2 ? [] : [
                {
                    type: 1,
                    components: [{
                        type: 2,
                        style: 2,
                        custom_id: `suggest_up_${Date.now()}_${msg.author.id}`,
                        label: "0",
                        emoji: { name: "⬆️" },
                        disabled: false
                    }, {
                        type: 2,
                        style: 2,
                        custom_id: `suggest_down_${Date.now()}_${msg.author.id}`,
                        label: "0",
                        emoji: { name: "⬇️" },
                        disabled: false
                    }]
                }
            ]
            let embeds = [{
                color: 0x252525,
                author: { name: `${msg.author.username}#${msg.author.discriminator}`, icon_url: msg.author.avatarURL.replace("128", "4096") },
                thumbnail: { url: msg.author.avatarURL.replace("128", "4096") },
                description: msg.cleanContent ? `> ${suggest_data.anti_links == true ? msg.cleanContent.replace(/\s?https\S+/g, '') : msg.cleanContent}` : null,
                timestamp: new Date(),
                image: { url: msg.attachments[0] && msg.attachments[0].content_type.includes("image") ? msg.attachments[0].url : null }
            }]

            if (suggest_data.webhook) {
                await bot.executeWebhook(suggest_data.webhook.id, suggest_data.webhook.token, { wait: true, components, embeds, avatarURL: msg.author.avatarURL.replace("128", "4096"), username: `${msg.author.username} (${msg.author.id})` }).then(async (m) => {
                    if (suggest_data.type_of_votes == 2 && m) {
                        await bot.addMessageReaction(m.channel.id, m.id, "⬆️")
                        await bot.addMessageReaction(m.channel.id, m.id, "⬇️")
                    }
                    if (suggest_data.comments && suggest_data.comments == true) await bot.createThreadWithMessage(m.channel.id, m.id, { name: "Comments - تعليقات" })
                })
            } else {
                await msg.channel.createMessage({ embeds, components }).then(async (m) => {
                    if (suggest_data.type_of_votes == 2 && m) {
                        await bot.addMessageReaction(m.channel.id, m.id, "⬆️")
                        await bot.addMessageReaction(m.channel.id, m.id, "⬇️")
                    }
                    if (suggest_data.comments && suggest_data.comments == true) await bot.createThreadWithMessage(m.channel.id, m.id, { name: "Comments - تعليقات" })
                })
            }
            if (suggest_data.line_url != false) {
                let res_fetch = await fetch(suggest_data.line_url)
                let image_buffer = Buffer.from(await res_fetch.arrayBuffer())
                await msg.channel.createMessage({}, { name: `${suggest_data.line_url.split("/")[6]}`, file: image_buffer })
            }
        }
    })
}