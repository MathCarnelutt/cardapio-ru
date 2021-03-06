import { ContextMessageUpdate } from "telegraf";
import { UserService } from "../providers";
import { getAgenda, AgendaJobs } from '../agenda/agenda';

const startReply = `
Bem vindo, {{user}}!
Eu sou o Bot do Cardápio do RU da UEL!
Vou te mandar todos os dias qual é o cardápio do dia!
Para mais informações, use o comando **/help**
`;

const userService = new UserService();

export async function startUser(ctx: ContextMessageUpdate, next: () => any) {
    const telegramUser = ctx.update.message.from;
    const chatId = ctx.update.message.chat.id;
    
    // Checar se ja está no banco
    const userInDb = await userService.findByTelegramId(telegramUser.id)
    if (!userInDb) {
        console.log('Adicionando usuario ', telegramUser.username);
        
        const user = await userService.create({
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            telegramId: telegramUser.id,
            languageCode: telegramUser.language_code,
            username: telegramUser.username,
            chatId,
        });
        
        // Criando o job de enviar desabilitado
        const agenda = getAgenda();
        const job = agenda.create(AgendaJobs.SEND_DAILY, { userId: (user as any)._id });
        job.disable();
        await job.save();

        user.jobId = job.attrs._id;
        await userService.update(user);
        
        if (ctx.update.message.text.startsWith('/start')) {
            ctx.replyWithMarkdown(startReply.replace('{{user}}', user.firstName));
        }
        

    }

    next();
}