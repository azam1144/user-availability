<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

## Description

This repository contains a module for managing user calendar availability and unavailability. The module facilitates the following key functionalities:

- Groups: Manage collections of companies and their associated unavailability schedules.
- User-Defined Calendars: Allow users to create and manage their own calendar preferences.
- User Unavailability: Track and manage time slots when host and guest users are unavailable within the system.



This repository serves as a code sample and example implementation of the aforementioned features. Feel free to explore and use it as a reference for your own projects.



## Features
- Flexible Group Management: Easily create and manage groups of companies, each with their own unavailability schedules.
- Custom Calendar Integration: Users can define their own calendars to better manage their time.
- Comprehensive Availability Tracking: Keep track of all time slots marked as unavailable by both host and guest users.


## Running the app
To get started with this module, follow these instructions:

```bash
$ npm install

# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```