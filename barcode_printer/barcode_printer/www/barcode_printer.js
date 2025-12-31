frappe.provide('barcode_printer');

barcode_printer.BarcodePrinter = class {
    constructor() {
        this.selected_items = [];
        this.setup_filters();
        this.setup_events();
        this.load_items();
    }

    setup_filters() {
        // Add filter fields
        this.filters = {
            item_group: '',
            brand: '',
            search_text: ''
        };
    }

    setup_events() {
        // Search button
        $('.btn-search').click(() => this.load_items());
        
        // Select all checkbox
        $('.select-all').change((e) => {
            $('.item-checkbox').prop('checked', e.target.checked);
            this.update_selection();
        });

        // Print button
        $('.btn-print').click(() => this.print_labels());
    }

    load_items() {
        frappe.call({
            method: "barcode_printer.barcode_printer.doctype.barcode_label.barcode_label.get_items_for_barcode",
            args: {
                item_group: this.filters.item_group,
                brand: this.filters.brand
            },
            callback: (r) => {
                this.render_items(r.message);
            }
        });
    }

    render_items(items) {
        let html = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th><input type="checkbox" class="select-all"></th>
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Barcode</th>
                    <th>UOM</th>
                </tr>
            </thead>
            <tbody>`;

        items.forEach(item => {
            html += `
                <tr>
                    <td>
                        <input type="checkbox" class="item-checkbox" 
                               data-item='${JSON.stringify(item)}'>
                    </td>
                    <td>${item.item_code}</td>
                    <td>${item.item_name}</td>
                    <td>${item.barcode || item.item_code}</td>
                    <td>${item.stock_uom}</td>
                </tr>`;
        });

        html += `</tbody></table>`;
        $('.item-list-container').html(html);

        // Bind checkbox events
        $('.item-checkbox').change(() => this.update_selection());
    }

    update_selection() {
        this.selected_items = [];
        $('.item-checkbox:checked').each((i, el) => {
            const item = $(el).data('item');
            this.selected_items.push(item);
        });
        
        $('.selected-count').text(this.selected_items.length);
    }

    print_labels() {
        if (this.selected_items.length === 0) {
            frappe.msgprint(__('Please select items to print'));
            return;
        }

        const quantity = $('#print-quantity').val() || 1;

        frappe.call({
            method: "barcode_printer.barcode_printer.doctype.barcode_label.barcode_label.generate_labels",
            args: {
                item_list: this.selected_items,
                quantity: quantity
            },
            callback: (r) => {
                this.open_print_format(r.message);
            }
        });
    }

    open_print_format(labels) {
        // Create print format HTML
        let html = `
        <div style="display: flex; flex-wrap: wrap; gap: 10px; padding: 20px;">
            ${labels.map(label => this.get_label_html(label)).join('')}
        </div>`;

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Barcode Labels</title>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; }
                            .barcode-label { page-break-inside: avoid; }
                        }
                        .barcode-label {
                            width: 3in;
                            height: 1.5in;
                            border: 1px solid #000;
                            padding: 10px;
                            text-align: center;
                            font-family: Arial, sans-serif;
                        }
                        .barcode-image {
                            max-height: 60px;
                            margin: 5px 0;
                        }
                        .item-code { font-weight: bold; font-size: 12px; }
                        .item-name { font-size: 10px; margin-bottom: 5px; }
                    </style>
                </head>
                <body>${html}</body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Auto print after loading
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    get_label_html(label) {
        return `
        <div class="barcode-label">
            <div class="item-code">${label.item_code}</div>
            <div class="item-name">${label.item_name}</div>
            <img src="${this.generate_barcode_image(label.barcode)}" 
                 class="barcode-image" 
                 alt="${label.barcode}">
            <div>${label.barcode}</div>
        </div>`;
    }

    generate_barcode_image(barcode_value) {
        // Using JsBarcode library (include in app)
        // For simplicity, using a placeholder
        return `https://barcode.tec-it.com/barcode.ashx?data=${barcode_value}&code=Code128`;
    }
}

// Initialize when page loads
frappe.ready(function() {
    window.barcode_printer = new barcode_printer.BarcodePrinter();
});