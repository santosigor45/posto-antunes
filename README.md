# Posto Antunes
## Overview
Posto Antunes is a Progressive Web Application (PWA) designed to streamline fuel management for a fleet of 200 vehicles in a school transportation company. It features a form with backend and frontend validation to capture and manage fuel supply data reliably.

## Features
- **Data Collection and Validation**: Captures fuel supply information through a form and implements comprehensive data validation on both the frontend and backend to minimize entry errors.
- **Data Storage**: All collected data are securely stored in a database.
- **Offline Functionality**: Supports offline data entry using IndexedDB. Data entered offline is cached and automatically synced with the server once an internet connection is re-established.
- **User Authentication and Admin Dashboard**: Includes features for user login and an administrative dashboard for data management and oversight.

## Installation
To run this project, you will need Python installed on your system. You can then install the required dependencies via pip:

    pip install -r requirements.txt

## Usage
- **Start the Application:** Launch the application locally at http://127.0.0.1:5000 by running:

        flask --app application run

## Configuration
Set up the necessary environment variables for your database connection and application security::
    
    export MYSQL_URL=mysql+pymysql://user@localhost/db_name
    export PERMANENT_SESSION_LIFETIME='31536000'
    export SECRET_KEY=strong_secret_key

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your features or fixes.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
For any queries or further assistance, please contact santosigor45@gmail.com.
