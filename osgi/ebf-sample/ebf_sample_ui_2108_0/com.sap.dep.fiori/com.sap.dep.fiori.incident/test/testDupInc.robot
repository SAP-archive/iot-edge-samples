*** Settings ***
Documentation     Navigates to the work order tile
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Report an Incident
${AppTitle}                     Report an Incident
${IncidentTitle}                input[id*=incidentTitle]
${DescriptionOfEvents}          textarea[id*=descriptionOfEvents]
${AccidentLocationButton}       span[id*=incident-reporting-location]
${AccidentLocaFirstElement}     tbody > tr:first-child
${DatePicker}                   input[id*=datePicker]
${DateChosen}                   div.sapUiCalItems > div:first-child > div:first-child
${TimePicker}                   input[id*=timePicker]
${TimezoneCombo}                span[id*=dep-fiori-incident-create--incident-reporting-timezone-arrow]
${TimezoneFirstElement}         li[id*=incident-reporting-timezone]
${SaveIncidentReport}           span[id*=save-button]
${MessageToastSuccess}          div:contains('created')
${MessageToastFail}             div:contains('Error')
${BackButton}                   backBtn[aria-label="Go Back"]
${DuplicateIncidentDialog}      div[id*=duplicate-incident-dialog]
${DialogOKButton}               div[id*=duplicate-incident-dialog] button[id*=btnDuplicateIncDialogOk]

*** Keywords ***

Input Incident Title
     Input Text                          jquery=${IncidentTitle}              This is a title

Input Description Of Events
     Input Text                          jquery=${DescriptionOfEvents}        This is a Description

Click Accident Location
     Click Element                       jquery=${AccidentLocationButton}

Click Accident Location First Element
     Click Element                       jquery=${AccidentLocaFirstElement}

Input Date Of Incident
     Input Text                          jquery=${DatePicker}              Feb 9, 2017  
Input Time Of Incident
     Input Text                          jquery=${TimePicker}              11:58

Click Timezone Combo
     Click Element                       jquery=${TimezoneCombo}

Click Timezone First Element
     Click Element                       jquery=${TimezoneFirstElement}

Click Save Incident Report
     Click Element                       jquery=${SaveIncidentReport}

Click Back Button
    Click Element                        jquery=#${BackButton}
    
Click Dialog OK Button
    Click Element                        jquery=${DialogOKButton}


*** Test Cases ***
Start Test
     Open Browser To Start
     Log In

Navigate to App
     Click Launchpad Tile And Entering
     
Set EHSAllowDupIncident to Y - 1
    Change Global Sync Option Config      EHSAllowDupIncident      Y

Type Title - 1
     Wait For                            Input Incident Title

Type Description Of Events - 1
     Wait For                            Input Description Of Events

Choose Accident Location - 1
     Wait For                            Click Accident Location
     Wait For                            Click Accident Location First Element

Pick Date Of Incident - 1
     Wait For                            Input Date Of Incident

Pick Time Of Incident - 1
     Wait For                            Input Time Of Incident

Choose Timezone - 1
     Wait For                            Click Timezone Combo
     Wait For                            Click Timezone First Element

Save Incident Report - 1
     Wait For                            Click Save Incident Report
     Wait Until Page Contains Element    jquery=${MessageToastSuccess}
     
Hit Back Button
    Wait For    Click Back Button
     
Set EHSAllowDupIncident to N - 1
    Change Global Sync Option Config      EHSAllowDupIncident      N

Type Title - 2
     Wait For                            Input Incident Title

Type Description Of Events - 2
     Wait For                            Input Description Of Events

Choose Accident Location - 2
     Wait For                            Click Accident Location
     Wait For                            Click Accident Location First Element

Pick Date Of Incident - 2
     Wait For                            Input Date Of Incident

Pick Time Of Incident - 2
     Wait For                            Input Time Of Incident

Choose Timezone - 2
     Wait For                            Click Timezone Combo
     Wait For                            Click Timezone First Element

Save Incident Report - 2
     Wait For                            Click Save Incident Report
     Wait Until Page Contains Element    jquery=${DuplicateIncidentDialog}
    
Dismiss Duplicate Incident Dialog
    Wait For                            Click Dialog OK Button
     
Set EHSAllowDupIncident to Y - 2
    Change Global Sync Option Config      EHSAllowDupIncident      Y

Type Title - 3
     Wait For                            Input Incident Title

Type Description Of Events - 3
     Wait For                            Input Description Of Events

Choose Accident Location - 3
     Wait For                            Click Accident Location
     Wait For                            Click Accident Location First Element

Pick Date Of Incident - 3
     Wait For                            Input Date Of Incident

Pick Time Of Incident - 3
     Wait For                            Input Time Of Incident

Choose Timezone - 3
     Wait For                            Click Timezone Combo
     Wait For                            Click Timezone First Element

Save Incident Report - 3
     Wait For                            Click Save Incident Report
     Wait Until Page Contains Element    jquery=${MessageToastSuccess}


Conclude
     Close Browser
