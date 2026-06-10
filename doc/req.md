# Rectifier

Rectifier is a AI enhanced json formatter system

## Features

    ### user can upload file 
        - only json file can be uploaded
    
    ### validate json
        - when the user upload/paste the json system is gonna validate the json and identify which lines have errors
        - the system will show the error message and error message should be human readable,
          for example, if the json is missing a comma, the error message should be "missing comma at line 3"
    
    ### beautify json
        - system will show the formatted json in the right panel, otherwise system will show the error message and highlight the error lines in the left panel
    
    ### Minify JSON
        - system will show the minified json in the right panel, otherwise system will show the error message and highlight the error lines in the left panel
    
    ### convert json to csv/xml/yaml
        - system will show the converted data in the right panel, otherwise system will show the error message and highlight the error lines in the left panel
    
    ### download
        - user can download the formatted data from the right panel [ format should be same as the shown]

    ### 

# data presentation
    - user can choose to show the data
        - tree view
        - text view
        - code view
        - text view
        - object view

## supported view
    - desktop view
    - mobile view

## UX Requirements
    - system will have two panels, `left` and `right` panel.
    - left panel is for user to paste the json, 
    - right panel is for system to show the formatted json or error message.
    - fucntionality buttons will be placed in the middle of the two panels
        - functionality buttons
            - upload data
            - validate json
            - beautify json
            - minify json
            - convert json to csv/xml/yaml [Dropdown menu]
            - download 

    ### Note: the system is inpired version of https://jsonformatter.org/# so overall feature should be similar to jsonformatter.org, but the system should have its unique design and user experience,