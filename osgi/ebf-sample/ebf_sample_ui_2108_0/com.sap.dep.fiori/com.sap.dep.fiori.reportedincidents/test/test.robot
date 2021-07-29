*** Settings ***
Documentation     Navigates to the work order tile return $('label:contains(' + 10020 + ')').parent().parent().children('td.sapMListTblSelCol').children('div.sapMLIBSelectM') Conclude Close Browser
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Reported Incidents
${AppTitle}                     Reported Incidents

${TIMEOUT}          10sec
${RETRY_RATE}       0.05sec


*** Keywords ***
Click Cancel Button
    ${temp}=    Execute Javascript    return $('button[id*=dep-fiori-reportedincidents-edit--cancel-button]')[0];
    Click Element    ${temp}

Click List Item
    ${temp}=    Execute Javascript    return $('tbody tr').first()[0]
    Click Element    ${temp}


*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Check List
    Click List Item
    Wait Until Page Contains Element       jquery=label:contains("Incident Title:")
    Click Cancel Button

Conclude
    Close Browser


