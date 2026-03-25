# Contracts Lifecycle

This document explains the lifecycle of a material contract from creation to completion.

## 1. Creation (`OPEN`)
*   **Action:** A Contract Maker uses the `/create_contract` command.
*   **Result:** The bot saves the contract to the database with an `OPEN` status. An interactive embed is posted in the configured `CONTRACTS_CHANNEL_ID` channel.
*   **Interaction:** The embed contains an "Accept Contract" button for other players to click.

## 2. Acceptance (`ACCEPTED`)
*   **Action:** A player (Contractor) clicks the "Accept Contract" button on the contract embed.
*   **Result:** The contract status changes to `ACCEPTED`. A new text channel is created specifically for this contract (named `contract-<id>`). Only the Contractor, the bot, and server admins have access.
*   **Interaction:** The original contract embed is updated to show it was accepted. In the new channel, the bot sends instructions and provides a "Submit Proof" button.

## 3. Proof Submission (`PROOF_PROVIDED`)
*   **Action:** The Contractor gathers the required materials and clicks "Submit Proof".
*   **Result:** The status updates to `PROOF_PROVIDED`. The contractor is temporarily locked from sending messages. The Contract Maker is given access to the channel and pinged.
*   **Interaction:** The bot presents the Contract Maker with two buttons: "Correct" and "Incorrect".

## 4. Verification (`MEETUP_ESTABLISHED` or `ACCEPTED`)
*   **Action (Correct):** The Contract Maker clicks "Correct".
    *   **Result:** Status updates to `MEETUP_ESTABLISHED`. The Contractor regains messaging rights to discuss the meetup. A "Delivery Completed" button appears.
*   **Action (Incorrect):** The Contract Maker clicks "Incorrect".
    *   **Result:** Status reverts to `ACCEPTED`. The Contractor regains messaging rights and a "Submit New Proof" button appears.

## 5. Delivery (`DELIVERED`)
*   **Action:** After the in-game exchange, either the Contractor or the Maker clicks "Delivery Completed".
*   **Result:** The status updates to `DELIVERED`. The Contractor is locked from messaging. The Maker is prompted to send payment.
*   **Interaction:** The bot presents a "Payment Sent" button to the Maker.

## 6. Completion (`COMPLETED`)
*   **Action:** The Maker confirms they've paid by clicking "Payment Sent".
*   **Result:** The status updates to `COMPLETED`. A final message is sent in the channel. The original contract embed in the public channel is updated to show "COMPLETED".
*   **End State:** The contract channel is now ready to be archived (either manually or by future bot enhancements).
