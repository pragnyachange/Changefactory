import type { JTFMetaCategory, JTFMetaColumn, JsonTableFormat } from './jtf';


const columnCategories: JTFMetaCategory[] = [
    {
        id: 'cat1',
        label: {
            de: 'Kategorie 1',
            en: 'Category 1'
        }
    },
];

const columns: JTFMetaColumn[] = [
    {
        "catid": "cat1",
        "id": "example",
        "label": {
            "en": "Example",
            "de": "Beispiel"
        },
        "type": "string",
        "options": {
            "resizable": true,
            "width": 120
        },
        "style": {
            "backgroundColor": "#eee"
        }
    }
];


function exampleWidget(pqfProjectId: string): JsonTableFormat {
    const project = Pqf.pm.getProject(pqfProjectId);

    const data = [
        project.name
    ];

    return {
        "id": "JFT-TS-EXAMPLE",
        "code": { "de": "beispiel", "en": "example" },
        "name": { "de": "Tabellenbeispiel", "en": "Table example" },
        "charts": [ { id: "chart1" } ],
        "data": data,
        "description": {
            "en": "TBD Description",
            "de": "TBD Beschreibung"
        },
        "initialChart": "chart1",
        "meta": {
            "options": {
                "adaptiveColumnWidths": true,
                //"groupBy": {columnId: "nr"},
                "showHeader": true,
                "sortBy": { columnId: "nr" }
            },
            "categories": columnCategories,
            "columns": columns
        },
        "mimeType": "application/x.pqf.table.json",
        "hints": [
            {
                "type": "info",
                "label": "Project",
                "text": { "de": "Beispiel", "en": "Example" }
            }
        ],
        "type": "JsonTable"
    };
}

const pqfProjectId = client.selectedObject.id;
const widgetData = exampleWidget(pqfProjectId);
widgetData;
