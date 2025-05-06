# ShmooCon Ticket Bot (bot-ts) 🎫🤖
*This is part of a proof-of-concept bot to automatically purchase tickets for ShmooCon, a conference that is notoriously hard to get tickets for. [See more info here.](https://github.com/ShmooConTix/ticket-bot)*

> [!CAUTION]
> This project is provided for research and educational purposes only. It is intended solely as a proof of concept. The author is not responsible for any misuse or actions taken by end users based on this code. Use at your own risk. We are not affiliated with ShmooCon in any way.

## About / Features
This repository serves as the actual "bot" of this operation, known as "bot-ts" in documentation. Below are the main features:
- URL "scoring" to ensure that the bot clicks the proper one
- Extensive logging and error handling
- Modular browser automation with Playwright
- "Stages" system for extensibility
- WebSocket / Live updates to [`api`](https://github.com/ShmooConTix/api)

## Installation
- Clone this repository
- Run all other services / components with Docker [(see more info here)](https://github.com/ShmooConTix/ticket-bot)
- Run `bun run ./src/index.ts` to start the environment. Make sure you have all the configuration set up.

## Contributing
This project / experiment is over and is not open to changes. Please contact me if you have questions.
