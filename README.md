# Suspended Ticket Nuke App

* Bulk delete suspended tickets by cause of suspension
* The causes of suspension are displayed as checkboxes & if checked then suspended tickets with those will be bulk deleted
* By default all settings are set to **False** but these can be changed and saved in other configurations other than all **False**
* The app will count all suspended tickets & filter to just those which are ready to be deleted based on either the default app settings or whichever settings are selected in the app itself
* If the settings selected within the app itself are different from the default saved setting then the default settings will be ignored & the settings selected within the itself will be used instead
* The app will display the total number of suspended tickets that meet the selected causes of suspension
* The user is prompted via a confirmation modal to confirm the total number of tickets to be deleted by entering the value into a text field then the button to bulk delete becomes functional

Pull requests are welcome, but you knew that.

### Screenshot(s):

![](http://g.recordit.co/trVFzChoqp.gif)