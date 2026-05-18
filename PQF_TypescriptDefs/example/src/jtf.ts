export interface JTFId {
    id: string;
}

export interface JTFHint {
    type: string;
    label: string;
    text: JTFCode;
}

type JTFCode = {[lang: string]: string};
type JTFStyleDef = {[key: string]: string};
type JTFOption = {[key: string]: (string | number | boolean)};

export interface JTFDataComplexItem {

}

export interface JTFDataSection {
    data: (string | number | JTFDataComplexItem)[];
    id: string;
    style: JTFStyleDef[];
}

export interface JTFMetaCategory {
    id: string;
    label: JTFCode;
}

export interface JTFMetaColumnFormat {
    format?: string;
    digits?: number;
    unit?: JTFCode;
    showIcon?: boolean;
    factor?: number;
}

export interface JTFMetaColumn {
    catid: string | null;
    format?: JTFMetaColumnFormat;
    id?: string;
    label: JTFCode;
    options?: JTFOption;
    type: string;
    style?: JTFStyleDef | (string | JTFStyleDef)[] | {[key: string]: JTFStyleDef};
}

export interface JTFMetaColumnGroupSortOptions {
    columnId: string;
    direction?: string;
}

export interface JTFMetaColumnOptions {
    adaptiveColumnWidths: boolean;
    groupBy?: JTFMetaColumnGroupSortOptions;
    showHeader: boolean;
    sortBy?: JTFMetaColumnGroupSortOptions;
    style?: JTFStyleDef;
}

export interface JTFMetaSection {
    categories: JTFMetaCategory[];
    columns: JTFMetaColumn[];
    options: JTFMetaColumnOptions;
}

export interface JsonTableFormat {
    charts: JTFId[];
    code: JTFCode;
    description: JTFCode;
    id: string;
    initialChart: string;
    createdAt?: string;
    createdBy?: string;
    data: (string | JTFDataComplexItem | JTFDataSection)[];
    meta: JTFMetaSection;
    hints: (string | JTFHint)[];
    mimeType: string;
    name: JTFCode;
    type: string;
}

type JTFClientDurationUnit = 'MONTH' | 'YEAR';

export interface JTFClient {
    selectedObject : {
        type: string,
        id: string
    },
    config: {
        view: string,
        lifecycle: boolean,
        colorscheme: 'poly' | 'mono',
        decimals: number,
        legend: {
            show: boolean,
            pos: {
                x: number, y: number, p: boolean
            }
        },
        showHeader: boolean,
        period: {
            startDate: {
                month: number,
                monthId: string,
                year: string,
                date: string,
                dateISO: string
            },
            endDate: {
                month: number,
                monthId: string,
                year: string,
                date: string,
                dateISO: string
            }
        },
        dateRange: {
            startDate: {
                unit: JTFClientDurationUnit,
                delta: number
            },
            duration: {
                unit: JTFClientDurationUnit,
                amount: number
            }
        },
        bubbles: number,
        includeSubportfolios: boolean,
        currency: string,
        chart_deviation: boolean,
        chart_label: boolean,
        chart_percentage: boolean,
        labels: {
            deviation: boolean,
            general: boolean,
            percentage: boolean
        },
        projectStatusFilter: {[projectState: string]: string},
        options: {[key: string]: string},
        canReload: boolean
    }
}

declare global {
    let client: JTFClient;
}
