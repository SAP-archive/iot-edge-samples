*** Settings ***
Documentation     Navigates to the work order tile return $('label:contains(' + 10020 + ')').parent().parent().children('td.sapMListTblSelCol').children('div.sapMLIBSelectM') Conclude Close Browser
Resource          ../../test-global/resource.robot

*** Variables ***
${TileText}                     Create Purchase Requisition
${AppTitle}                     Purchase Requisitions

${TIMEOUT}          10sec
${RETRY_RATE}       0.05sec
${AddMaterialButton}            span[id*=materialAddButton]
${DialogErrorMessageButton}     button[id*=messages-button]
${CloseErrorMessageButton}     button[title=Close]


*** Keywords ***
Click Material Add Button
    Click Element                       jquery=${AddMaterialButton}

Select Material
    [Arguments]    ${matnr}
    ${selectMaterial}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('div.sapMLIBSelectM')[0];
    Click Element    ${selectMaterial}

Input Qty
    [Arguments]    ${matnr}    ${qty}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('input.sapMInputBaseInner[type=number]')[0];
    Input Text    ${temp}    ${qty}

Click Date Button
    [Arguments]    ${matnr}     ${datePicker}
    ${temp}=    Execute Javascript    return $('label:contains(' + ${matnr} + ')').parent().parent().parent().find('span[id*=${datePicker}]')[0];
    Focus            ${temp}
    Click Element    ${temp}

Click Ok Button
    ${temp}=    Execute Javascript    return $('button[id*=save-button]')[0];
    Click Element    ${temp}

Click Error Message Button
    Click Element    jquery=${DialogErrorMessageButton}

Close Error Message Box
    Click Element    jquery=${CloseErrorMessageButton}

Edit Material
    [Arguments]    ${matnr}    ${qty}    ${year}    ${month}   ${day}   ${datePicker}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Input Qty   ${matnr}    ${qty}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Click Date Button   ${matnr}    ${datePicker}
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Pick Date    ${year}    ${month}   ${day}  



*** Test Cases ***
Start Test
    Open Browser To Start
    Log In

Navigate to App
    Click Launchpad Tile And Entering

Choose Material
    Wait For    Click Material Add Button
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   10020
    Edit Material        10020    1    2018    'September'    20    picker
    Wait For    Click Ok Button


Add Empty Quantity
    Sleep   0.5
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Input Qty   10020    ${EMPTY}

Check Error Massage
    Wait For    Click Ok Button
    Wait For    Click Error Message Button
    Wait Until Page Contains Element       jquery=div:contains(Material 10020 quantity infomation missing)
    Wait For    Close Error Message Box

Add Correct Qty And Time
    Sleep   0.5
    Edit Material        10020    3    2018    'August'    11    datePicker
    Wait For    Click Ok Button

Try To Add A Duplication
    Wait For    Click Material Add Button
    Wait Until Keyword Succeeds    ${TIMEOUT}    ${RETRY_RATE}    Select Material   10020

Check Duplication Error Massage
    Wait For    Click Error Message Button
    Wait Until Page Contains Element       jquery=div:contains(already in the editing purchase requisition)

Conclude
    Close Browser




