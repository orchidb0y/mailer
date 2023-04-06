# MJML Mailer

## About

This package was built with the purpose of serving as a quick means of proof testing email templates built with the MJML framework. Images should be PNG. It connects to a supabase API for hosting, where it will host the whole template like:

yourTemplate/\
├─ index.mjml\
├─ marketo.mjml\
├─ img/\
│ ├─ imageName.png\
│ ├─ imageName.png\
│ ├─ ...

It will only export templates with that folder structure and file names. Anything else will not work. Also, images src URLs on the mjml file must be local paths e.g. './img/imageName.png'. If they are different, the parser will not be able to replace local URLs with signed URLs generated by supabase.

## Requirements for Marketo MJML

 ***ALL top elements in the MJML file (`<mj-section>` or `<mj-wrapper>`) MUST have a `css-class` attribute. That is how the Marketo modules are going to be named. Try using a name descriptive of the function of the section/wrapper.***

 ***All lateral padding (that is, left and right padding) of top elements (`<mj-section>` or `<mj-wrapper>`), MUST be fixed. Variables are NOT allowed as values for top elements. Blame it on Outlook.***

Marketo variables can be used with the MJML, and they will be parsed for Marketo. The required syntax is as follows, and **MUST** be followed:

**Text variable:**   \${text: NAME; default: Text with spaces and no quotation marks!}\
**Number variable:** \${number: NAME; default: 10} (ONLY NUMBERS)\
**Color variable:** \${color: NAME; default: #FFFFFF} (ONLY HEX COLORS)\
<!-- **HTML variable:** ${html: NAME; default: <html>something</html>} (ONLY HTML) -->

The name value *MUST* be a single word. Camel case is not mandatory. Both the name and default fields can be wrapped in single quotes. Double quotes are ***FORBIDDEN*** to avoid conflict with the HTML. All following examples are valid Marketo variables and will be correctly parsed by Mailer:

**`${text: fontWeight; default: bold}`**\
**`${text: textAlignment; default: 'left'}`**\
**`${color: 'bgColor'; default: '#F7F7F7'}`**\
**``${number: 'name' ; default: '20' }`**

The last example is meant to demonstrate that whitespaces before and after the name and default values or before and after the semi-colon will be trimmed. Whitespace before the name attribute (text, color, number) is not allowed:

**`${   text: someName; default: some text}`**

The above variable is invalid. Even though the rest of the variable is valid, the whitespace between '${' and 'text' renders it invalid.

It is preferable that you just follow the regular `**\${text: coolName; default: someText}**` with no whitespaces and quotes.

<br>

e.g.:\
`<mj-column`\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`background-color="${color: columnBgColor; default: #F2F2F2}"`\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`padding="0px ${number: columnHPadding; default: 10}px">`\
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***CHILDREN***\
`</mj-column>`

<br>

The default field is **NOT** optional. The default field of a text variable can be filled with any kind of text, whitespace and most special characters. It can be wrapped by single quotes. Whitespace before and after the start of the text will be trimmed.

Remember to follow the template correctly.

## Commands

### login \<id\> \<password\>

The package uses Nodemailer to send mails. To that end, it needs valid credentials to work. For now, it only works with Gmail. If your gmail account uses 2FA, you will need to generate a app password on your security settings.

### bucket \[-c/-d] \[name]

Creates or deletes a bucket or lists all buckets on supabase. Each bucket acts as a folder where each email template is stored. Bucket names should be easy to remember and relate to the template. Calling this command without arguments will list all existing buckets.

-c or --create creates a bucket.

-d or --delete deletes a bucket (and all files in it).

### export \[-w/-n/-i/-c/-m] \<name\> \[path]

Exports a template's .mjml and .png files to a bucket. Path is optional on Windows only.

-m or --marketo will keep watching the folder's index.mjml for changes.

-n or --new-path will ignore and overwrite the saved path at paths.json.

-i or --images will skip uploading images.

-c or --clean will clean the

### prepare \[-m] \<name\>

Replaces all image URLs from local to remote paths with temporary URLs generated by supabase, and then parses MJML into HTML ready for mailing.

-m or --marketo will parse it into a Marketo compatible HTML. Module tags and variables have to be added manually. Future support for custom MJML components is planned.

### mail \[-m] \<name\> \<recipients\>

Sends the template on a bucket to all recipients. Recipient list should be surrounded by quotation marks and separated by commas e.g. ', '.

-m or --marketo will mail the Marketo compatible HTML.

### import \<name\>

Downloads the template's files from the supabase bucket.

## Usage

First, run `mailer`. You will be prompted for the supabase keys and URL. Then run `mailer login <your@email.adress> <yourpassword>` to connect to the email from which samples will be sent.

Each template should have its own folder, implemented on supabase as buckets. Create a bucket with `mailer bucket -c <bucketname>`. The name should preferably relate to the template.

Export the .mjml and .png files to the remote bucket with `mailer export <bucketname> [localpath]`. The path argument is optional. If you don't input a path, the app will open a folder select window where you can browse the filesystem for the folder where the template's files are located. The template folder MUST follow the example at [about](#about) for the export to work succesfully. The `-w` flag will watch the folder's MJML file for changes and will continuously upload the newest version to supabase. The `-m` flag will export `marketo.mjml`.

You can use `mailer parse [-m] <bucketname>` to parse the .MJML file into an HTML file that can then be sent over email.

The optional `-m` flag instructs the parser to create Adobe Marketo compatible HTML.

To send a sample, use `mailer mail <bucketname> <"first@recipient.com, second@recipient.com, ...">` The `-m` flag will instruct the Marketo compatible html to be sent, if it exists.

To download the a template's files, including images, the MJML file and either regular or Marketo HTML, use `mailer import <bucketname>`. If you don't use any flag, the regular HTML will be downloaded. If you use the `-m` flag, the Marketo HTML will be downloaded. The files will be downloaded at root/downloads.