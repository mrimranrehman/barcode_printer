from . import __version__ as app_version

app_name = "barcode_printer"
app_title = "Barcode Printer"
app_publisher = "Your Company"
app_description = "Barcode Label Generator and Printer"
app_email = "your-email@example.com"
app_license = "MIT"

# Include JS in Desk
app_include_js = ["barcode_printer.bundle.js"]

# DocType Events
doc_events = {
    "Item": {
        "on_update": "barcode_printer.barcode_printer.doctype.barcode_label.barcode_label.update_item_barcode"
    }
}

# Fixtures
fixtures = ["Custom Field"]