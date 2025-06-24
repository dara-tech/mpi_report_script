# SQL Analyst: Interactive MPI Report Runner

SQL Analyst is a modern web application designed to streamline the execution and analysis of complex SQL reports. It provides an interactive dashboard, a powerful script editor, and a clear results viewer, making it easier than ever to work with your database and extract critical insights.

While it includes legacy support for decrypting `.h149` MySQL backups, its core strength lies in its dynamic, user-friendly interface for running and managing SQL scripts.

## ✨ Key Features

- **Interactive Dashboard**: Get an at-a-glance view of key indicators from your main report script. Cards are dynamically generated and clickable for drill-down analysis.
- **Collapsible Sidebar**: A sleek, modern sidebar provides easy navigation between the Dashboard, Script Browser, Editor, and Settings, with a connection status indicator.
- **Powerful Script Browser & Editor**: Browse all your `.sql` scripts, open them in a feature-rich editor, modify parameters directly in the script, and execute them with a single click.
- **Dynamic Results Viewer**: View query results in a clean, paginated table. Export your data to CSV or JSON for further analysis.
- **Centralized Settings**: Configure your database connection and application settings from a single, easy-to-use page.
- **Execution History**: Keep track of all executed scripts, their parameters, and performance.
- **Legacy Backup Support**: Includes tools to decrypt and process encrypted `.h149` backup files.

## 🚀 Getting Started

Follow the [**QUICKSTART.md**](./QUICKSTART.md) guide for a fast, 5-minute setup.

### Prerequisites

- **Node.js v16+**
- **MySQL Server**

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dara-tech/mpi_report_script.git
    cd mpi_report_script
    ```

2.  **Install dependencies for both server and client:**
    ```bash
    npm install
    cd client && npm install && cd ..
    ```

3.  **Configure your environment:**
    -   Copy `env.example` to a new file named `.env`.
    -   Update the `.env` file with your MySQL database credentials.

4.  **Run the application:**
    ```bash
    npm run dev
    ```

5.  Open your browser to the URL provided in the terminal (usually `http://localhost:5173` or a similar port).

## 🔧 Project Structure

```
/
├── client/         # React frontend (Vite)
├── server/         # Node.js backend (Express)
├── MPI Report Script/ # Your collection of .sql report scripts
├── .env            # Environment variables (DB connection, etc.)
├── package.json    # Project scripts and dependencies
└── ...
```

## 💡 How to Use

1.  **Dashboard**: The app opens to the Dashboard, which shows live data from your primary indicator script (`Indicator_ART_update.sql`).
2.  **Drill Down**: Click on any indicator card on the dashboard to automatically open the corresponding child script in the **Editor** tab.
3.  **Edit & Execute**: In the **Editor**, you can modify the SQL script directly. Change `SET` variables like `@StartDate` or `@EndDate` to adjust the report's parameters. Click **Execute** to run the script.
4.  **View Results**: The results will appear in the **Results** tab, neatly formatted and ready for export.
5.  **Browse Scripts**: Use the **Scripts** tab to browse and open any other SQL script from your `MPI Report Script` directory.

## 🛠️ Troubleshooting

-   **`EADDRINUSE` Error**: If the server fails to start with an `EADDRINUSE` error, it means the port is already in use by another process. Find and stop the process using that port.
    -   **macOS/Linux**: `lsof -i :PORT` then `kill -9 PID`
    -   **Windows**: `netstat -ano | findstr :PORT` then `taskkill /PID PID /F`
-   **Database Connection Issues**: Double-check your credentials in the `.env` file and ensure your MySQL server is running and accessible.

## 🤝 Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request.

## 📄 License

This project is licensed under the MIT License. 