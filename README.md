# React Form
This javascript library lets you define an HTML form with JSON schema and generates pre-configured HTML elements for all json elements defined in schema (String -> textbox, Boolean -> checkbox). It also binds the given model value to corresponding HTML elements. This binding is two way i.e. update on model attribute would update HTML element state as well as updates to HTML element state would update the corresponding model value. You can also specify validations for JSON schema elements and the framework would validate the model against the specified validations. 
A typical HTML form is defined in the following way
`schema : {
	  "readOnly" : true,
	  "type" : "object",
	  "properties" : {
		"displayName" : {
		  "type" : "string",
		  "required" : true,
		},
		"amount" : {
		  "type" : "number",
		  "pattern" : /^\d+(\.\d{0,2})?$/,
		},
		"checkbox" : {
		  "type" : "boolean",
		},
	  },
	},
   form: ['*'],
          	    model: {
	displayName : "wow",
	amount: 10.2343,
	checkbox: true,
},
`

# Playground
A working demo is hosted at https://amit187.github.io/react-form/ . See the model changing instantly when you change any html element state and vice versa. It lets you write the UI behavior with Object and attributes than the conventional HTML element manipulation. Isn’t it a great way to write UI?
(See a sample React Page component ExamplePage.js to see how fun is it to write a master detail grid?)

