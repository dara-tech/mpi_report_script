# SQL Analyst - 5-Minute Quick Start Guide

Get up and running with the SQL Analyst application in just a few minutes! 🚀

## Prerequisites

-   **Node.js**: Version 16 or higher.
-   **MySQL**: A running instance of MySQL with your database.

## Step 1: Install & Configure

1.  **Download or Clone:**
    Get the project files onto your machine.
    ```bash
    git clone https://github.com/dara-tech/mpi_report_script.git
    cd mpi_report_script
    ```

2.  **Install Dependencies:**
    This command installs packages for both the server and the client.
    ```bash
    npm install && (cd client && npm install)
    ```

3.  **Set Up Environment:**
    Create your environment file from the example and add your database credentials.
    ```bash
    cp env.example .env
    ```
    Now, open the `.env` file and fill in your `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_DATABASE`.

## Step 2: Launch the Application

Start the development server for both the frontend and backend.

```bash
npm run dev
```

Wait for the terminal to show that the servers are running, then **open your browser** to the local URL provided (e.g., `http://localhost:5173`).

## Step 3: Your First Report

Here's the new, streamlined workflow:

1.  **View the Dashboard**: The application starts on the **Dashboard**, which automatically displays key indicators from your main report script.

2.  **Drill Down to a Script**: Click on any indicator card (e.g., "Active ART Patients"). You will be taken directly to the **Editor** tab with the relevant child script loaded.

3.  **Modify Parameters**: Inside the **Editor**, you can change the report's parameters by editing the `SET` statements at the top of the script. For example, you can change the `@EndDate`.
    ```sql
    -- Before
    SET @EndDate = '2024-12-31';

    -- After
    SET @EndDate = '2025-03-31';
    ```

4.  **Execute the Script**: Click the **Execute** button.

5.  **See the Results**: You will be automatically switched to the **Results** tab, where you can see the data from your query. You can also export it to CSV or JSON.

--- 

**That's it!** You're now ready to explore, edit, and run all your SQL reports with ease. For more detailed information, check out the main [**README.md**](./README.md) file. 