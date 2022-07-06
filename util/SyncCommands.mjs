const commands = [{
    type: 1,
    name: "cancel-suggestion",
    description: "الغاء نظام الاقتراحات"
},{
    type: 1,
    name: "setup-suggestion",
    description: "تعيين نظام الاقتراحات",
    options: [{
        name: "suggest_channel",
        description: "روم الذي تريد جعل فيه الاقتراحات",
        required: true,
        channel_types: [0],
        type: 7
    }, {
        name: `type_of_votes`,
        description: `نوع طريقة تصويت للاقتراات`,
        required: true,
        choices: [
            {
                name: `رياكشنات`, value: "2"
            },
            {
                name: `ازرار`, value: "1"
            }
        ],
        type: 3,
    },{
        name: `comments`,
        description: `هل تريد اتاحة ثريد تعليقات لكل اقتراح؟`,
        required: true,
        type: 5
    },{
        name: `anti_links`,
        description: `هل تريد حذف الروابط من رسالة الاقتراح؟`,
        required: true,
        type: 5
    },{
        name: "line_image",
        description: "اذا كنت تريد وضح صورة خط بين رسائل الاقتراحات",
        required: false,
        type: 11
    },{
        name: "webhook",
        description: "اذا كنت تريد جعل رسالةا لاقتراح باسم وصورة شخص الذي قام بعمل الاقتراح باستخدام ويب هوك",
        required: false,
        type: 5
    }]
}]

export default async function (bot) {
    let currentCommands = await bot.getCommands() || [];
    let newCommands = commands.filter((cmd) => !currentCommands.some((c) => c.name == cmd.name))
    newCommands.forEach(async (cmd) => {
        await bot.createCommand(cmd)
    })
    let updatedCommands = currentCommands.filter((c) => commands.some((c2) => c2.description != c.description || c2.type != c.type || c2.options != c.options));

    if (updatedCommands.length != 0) {
        updatedCommands.forEach(async (updatedCommand) => {
            let cmdID = updatedCommand.id
            if (commands.find((c) => c.name === updatedCommand.name)) {
                let previousCommand = commands.find((c) => c.name === updatedCommand.name);

                await bot.editCommand(cmdID, previousCommand)
            }
        })
    }

    currentCommands.forEach(async (oldcmd) => {
        if (!commands.some((c) => c.name == oldcmd.name)) {
            await bot.deleteCommand(oldcmd.id)
        }
    })
}