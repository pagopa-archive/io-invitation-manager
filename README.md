# Invitation Manager for the IO App

## Environment variables

Those are all Environment variables needed by the application:

| Variable name       | Description                                                   | type    | default                                            |
|---------------------|---------------------------------------------------------------|---------|----------------------------------------------------|
| IO_IM_DEFAULT_LOGGER_LEVEL   | The log level used for Winston logger                         | loglevel | info                                              |
| IO_IM_GOOGLE_CLIENT_EMAIL | The client email of the google service-account | string | |
| IO_IM_GOOGLE_PRIVATE_KEY_PATH | The path of the google service-account private key | string | |
| IO_IM_GOOGLE_SPREADSHEET_ID | The id of the google spreadsheet where invitations are stored | string | |  