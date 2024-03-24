<?php

// Set response content type to JSON
header('Content-Type: application/json');

// Define password for authentication (you may want to change this)
$password = 'your-token-which-will-be-used-in-frontend';

/* Error codes
0 - authentication failed;
1 - missing parameters;
2 - invalid action
3 - file not found;
4 - fetched successfully
5 - updated successfully
6 - other error;
*/


// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if all required parameters are set
    if (isset($_POST['password'], $_POST['action'], $_POST['filename'], $_POST['data'])) {
        

        // Authenticate the request
        if ($_POST['password'] === $password) {
            // Get action, filename, and data from POST parameters
            $action = $_POST['action'];
            $filename = "data/".trim($_POST['filename']).".json";
            $data = $_POST['data'];

            // Validate action parameter
            if ($action === 'get') {
                // Check if the file exists
                if (file_exists($filename)) {
                    // Read the content of the file
                    $fileContent = file_get_contents($filename);
                    // Return success response with file content
                    echo json_encode(array('status' => 'success', 'code' => 4, 'data' => json_decode($fileContent), 'message' => 'File content retrieved successfully'));
                } else {
                    // Return failure response if the file doesn't exist
                    echo json_encode(array('status' => 'fail', 'code' => 3, 'data' => null, 'message' => 'File does not exist'));
                }
            } elseif ($action === 'post') {
                file_put_contents($filename, $data);
                // Return success response
                echo json_encode(array('status' => 'success', 'code' => 5, 'data' => null, 'message' => 'File content updated successfully'));
            } else {
                // Return failure response if action is neither 'get' nor 'post'
                echo json_encode(array('status' => 'fail', 'code' => 2, 'data' => null, 'message' => 'Invalid action'));
            }
        } else {
            // Return failure response for authentication failure
            echo json_encode(array('status' => 'fail', 'code' => 0, 'data' => null, 'message' => 'Authentication failed'));
        }
    } else {
        // Return failure response if any of the required parameters is missing
        echo json_encode(array('status' => 'fail', 'code' => 1, 'data' => $_POST, 'message' => 'Missing parameters'));
    }
} else {
    // Return failure response for requests other than POST
    echo json_encode(array('status' => 'fail','code' => 6, 'data' => null, 'message' => 'Only POST requests are allowed'));
}

?>
