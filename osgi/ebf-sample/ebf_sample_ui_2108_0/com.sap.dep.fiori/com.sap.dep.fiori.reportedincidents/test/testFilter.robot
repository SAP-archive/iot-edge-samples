*** Settings ***
Documentation     Navigates to the work order tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Reported Incidents
${AppTitle}                     Reported Incidents
${FilterButton}                 span[id*=dep-fiori-reportedincidents-enter--filter-bar-btnFilters-inner]
${FilterInputIncidentID}          input[id*=dep-fiori-reportedincidents-enter--incidentID-inner]
${GoButton}                     span[id*=dep-fiori-reportedincidents-enter--filter-bar-btnGoFilterDialog-inner]


*** Keywords ***
Type In Incident ID Info For Filtering
     Input Text            jquery=${FilterInputIncidentID}              I04250000006

*** Test Cases ***
Start Test
     Open Browser To Start
     Log In

Navigate to App
     Click Launchpad Tile And Entering

Click Filter Button
     Click Element         jquery=${FilterButton}

Input Incident ID And Description Info For Filtering
     Wait For         Type In Incident ID Info For Filtering

Click Go Button And Check Filtering results
     Click Element         jquery=${GoButton}
     Wait Until Page Contains Element       jquery=label:contains(I04250000006)

Conclude
    Close Browser