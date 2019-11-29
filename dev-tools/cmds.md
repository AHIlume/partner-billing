# PACKAGE MANAGEMENT
sfdx force:package:version:create -x -p "Partner Billing" -w 10 -v $DevHubAlias

sfdx force:package:install -s AllUsers -t Mixed -w 10 -b 5 -p "Partner Billing@0.3.1-1" -u $MyUatAlias

sfdx force:package:version:promote -p "Partner Billing@0.3.1-1"

# ANONYMOUS APEX
sfdx force:apex:log:get -n 5 > .\dev-tools\anonymousApex\logs\latestLog.log

sfdx force:apex:execute -f .\dev-tools\anonymousApex\resetApprovedTimeEntries.apex > .\dev-tools\anonymousApex\logs\resetApprovedTimeEntries.log
sfdx force:apex:execute -f .\dev-tools\anonymousApex\restDraftInvoicesTestData.apex > .\dev-tools\anonymousApex\logs\restDraftInvoicesTestData.log