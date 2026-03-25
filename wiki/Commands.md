# Commands Reference

This document outlines the Discord slash commands provided by the Star Citizen Bot.

## `/create_contract`

**Description:** Creates a new material contract and posts it to the designated contracts channel.
**Required Role:** Contract Maker (Configured via `CONTRACT_MAKER_ROLE_ID` in `.env`)

### Arguments:

*   `material` (String, Required): The name of the material needed (e.g., Laranite, Quantanium). Features auto-complete based on synchronized UEXCorp data.
*   `location` (String, Required): The drop-off location (e.g., Lorville, Area18). Features auto-complete based on synchronized UEXCorp data.
*   `quantity` (Integer, Required): The amount of the material needed. Minimum value is 1.
*   `quality` (Integer, Optional): The quality rating of the material. Defaults to 500. Materials with a quality below 500 are considered poor and will trigger a warning message upon creation. Minimum value is 1.
*   `reward` (Number, Required): The payment offered for completing the contract, measured in aUEC. Minimum value is 1.
*   `deadline_hours` (Integer, Required): The number of hours until the contract expires. Minimum is 1, maximum is 720 (30 days).

### Example Usage:
`/create_contract material:Quantanium location:Lorville quantity:500 quality:500 reward:1500000 deadline_hours:24`

This will create a new entry in the database and post an interactive embed in the designated `CONTRACTS_CHANNEL_ID` channel.
