import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import * as bodyParser from "body-parser";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new Logger(),
        bodyParser: false,
    });

    app.use("/clerk-webhook", bodyParser.raw({ type: "application/json" }));
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
