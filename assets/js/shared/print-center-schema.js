/* 原站可见表头静态证据；不解析业务实体、不注册组件。column key仅本机展示键。 */
(function () {
  'use strict';
  const freeze = value => {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  };
  Object.defineProperty(window, 'ERP_PRINT_SCHEMA', {
    value: freeze({
  "evidence": "outputs/aicard-print-20261020/source-visible-categories-complete.json",
  "widthSemantics": "observed visible header width; not original declared CSS or responsive contract",
  "keySemantics": "local presentation ordinal within category; not source field or business identity",
  "categories": [
    {
      "id": "sales-contract",
      "label": "销售单/合同",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_1_column_1 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "订货单",
          "width": 200,
          "classes": "el-table_1_column_2 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "内部单号",
          "width": 120,
          "classes": "el-table_1_column_3 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "合作商",
          "width": 100,
          "classes": "el-table_1_column_4 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "C 端/业主",
          "width": 100,
          "classes": "el-table_1_column_5 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "销售",
          "width": 80,
          "classes": "el-table_1_column_6 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "跟单",
          "width": 80,
          "classes": "el-table_1_column_7 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "订货日期",
          "width": 120,
          "classes": "el-table_1_column_8 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "订单创建日期",
          "width": 160,
          "classes": "el-table_1_column_9 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "打印状态",
          "width": 100,
          "classes": "el-table_1_column_10 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "最近打印时间",
          "width": 160,
          "classes": "el-table_1_column_11 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "操作",
          "width": 150,
          "classes": "el-table_1_column_12 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "delivery",
      "label": "交货单",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_2_column_13 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "交货单号",
          "width": 201,
          "classes": "el-table_2_column_14 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "产品数",
          "width": 86,
          "classes": "el-table_2_column_15 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "合作商",
          "width": 108,
          "classes": "el-table_2_column_16 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "C 端/业主",
          "width": 108,
          "classes": "el-table_2_column_17 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "申请人",
          "width": 86,
          "classes": "el-table_2_column_18 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "出货状态",
          "width": 97,
          "classes": "el-table_2_column_19 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "创建日期",
          "width": 129,
          "classes": "el-table_2_column_20 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "更新时间",
          "width": 129,
          "classes": "el-table_2_column_21 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "打印状态",
          "width": 97,
          "classes": "el-table_2_column_22 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "最近打印时间",
          "width": 173,
          "classes": "el-table_2_column_23 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "操作",
          "width": 129,
          "classes": "el-table_2_column_24 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "production-instruction",
      "label": "生产指令单",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_3_column_25 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "产品",
          "width": 200,
          "classes": "el-table_3_column_26 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "任务编号",
          "width": 120,
          "classes": "el-table_3_column_27 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "工序",
          "width": 180,
          "classes": "el-table_3_column_28 is-leaf el-table__cell",
          "sortable": false,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "订货单",
          "width": 120,
          "classes": "el-table_3_column_29 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "内部单号",
          "width": 120,
          "classes": "el-table_3_column_30 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "合作商",
          "width": 100,
          "classes": "el-table_3_column_31 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "C 端/业主",
          "width": 100,
          "classes": "el-table_3_column_32 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "材料/颜色",
          "width": 108,
          "classes": "el-table_3_column_42 is-center is-leaf el-table__cell",
          "sortable": false,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "规格尺寸",
          "width": 108,
          "classes": "el-table_3_column_43 is-center is-leaf el-table__cell",
          "sortable": false,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "材质",
          "width": 100,
          "classes": "el-table_3_column_33 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "产品说明",
          "width": 150,
          "classes": "el-table_3_column_34 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-12",
          "label": "数量",
          "width": 70,
          "classes": "el-table_3_column_35 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-13",
          "label": "计划开始时间",
          "width": 120,
          "classes": "el-table_3_column_36 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-14",
          "label": "订货日期",
          "width": 100,
          "classes": "el-table_3_column_37 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-15",
          "label": "订单创建时间",
          "width": 150,
          "classes": "el-table_3_column_38 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-16",
          "label": "打印状态",
          "width": 90,
          "classes": "el-table_3_column_39 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-17",
          "label": "最近打印时间",
          "width": 150,
          "classes": "el-table_3_column_40 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-18",
          "label": "操作",
          "width": 120,
          "classes": "el-table_3_column_41 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "carton-label",
      "label": "外箱标签",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_4_column_44 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "产品",
          "width": 200,
          "classes": "el-table_4_column_45 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "任务编号",
          "width": 88,
          "classes": "el-table_4_column_46 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "订货单",
          "width": 108,
          "classes": "el-table_4_column_47 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "内部单号",
          "width": 108,
          "classes": "el-table_4_column_48 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "采购单",
          "width": 108,
          "classes": "el-table_4_column_49 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "合作商",
          "width": 100,
          "classes": "el-table_4_column_50 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "C 端/业主",
          "width": 100,
          "classes": "el-table_4_column_51 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "材料/颜色",
          "width": 108,
          "classes": "el-table_4_column_66 is-center is-leaf el-table__cell",
          "sortable": false,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "规格尺寸",
          "width": 108,
          "classes": "el-table_4_column_65 is-center is-leaf el-table__cell",
          "sortable": false,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "材质",
          "width": 150,
          "classes": "el-table_4_column_52 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "产品说明",
          "width": 100,
          "classes": "el-table_4_column_53 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-12",
          "label": "数量",
          "width": 60,
          "classes": "el-table_4_column_54 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-13",
          "label": "包装件数",
          "width": 100,
          "classes": "el-table_4_column_55 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-14",
          "label": "单个体积",
          "width": 90,
          "classes": "el-table_4_column_56 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-15",
          "label": "生产开始时间",
          "width": 108,
          "classes": "el-table_4_column_57 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-16",
          "label": "生产完成时间",
          "width": 108,
          "classes": "el-table_4_column_58 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-17",
          "label": "订货日期",
          "width": 100,
          "classes": "el-table_4_column_59 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-18",
          "label": "订单创建时间",
          "width": 116,
          "classes": "el-table_4_column_60 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-19",
          "label": "打印状态",
          "width": 80,
          "classes": "el-table_4_column_61 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-20",
          "label": "最近打印时间",
          "width": 116,
          "classes": "el-table_4_column_62 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-21",
          "label": "仓库",
          "width": 80,
          "classes": "el-table_4_column_63 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-22",
          "label": "操作",
          "width": 100,
          "classes": "el-table_4_column_64 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "material-label",
      "label": "物料标签",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_5_column_67 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "物料",
          "width": 180,
          "classes": "el-table_5_column_68 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "颜色",
          "width": 108,
          "classes": "el-table_5_column_69 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "尺寸",
          "width": 108,
          "classes": "el-table_5_column_70 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "规格参数",
          "width": 108,
          "classes": "el-table_5_column_71 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "类型",
          "width": 80,
          "classes": "el-table_5_column_72 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "订货单",
          "width": 108,
          "classes": "el-table_5_column_73 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "内部单号",
          "width": 108,
          "classes": "el-table_5_column_74 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "任务编号",
          "width": 88,
          "classes": "el-table_5_column_75 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "采购单",
          "width": 108,
          "classes": "el-table_5_column_76 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "产品",
          "width": 200,
          "classes": "el-table_5_column_77 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "备注",
          "width": 148,
          "classes": "el-table_5_column_78 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-12",
          "label": "数量",
          "width": 60,
          "classes": "el-table_5_column_79 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-13",
          "label": "单位",
          "width": 60,
          "classes": "el-table_5_column_80 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-14",
          "label": "采购员",
          "width": 100,
          "classes": "el-table_5_column_81 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-15",
          "label": "创建人",
          "width": 100,
          "classes": "el-table_5_column_82 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-16",
          "label": "采购创建时间",
          "width": 116,
          "classes": "el-table_5_column_83 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-17",
          "label": "到货时间",
          "width": 100,
          "classes": "el-table_5_column_84 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-18",
          "label": "打印状态",
          "width": 90,
          "classes": "el-table_5_column_85 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-19",
          "label": "最近打印时间",
          "width": 116,
          "classes": "el-table_5_column_86 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-20",
          "label": "仓库",
          "width": 80,
          "classes": "el-table_5_column_87 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-21",
          "label": "操作",
          "width": 100,
          "classes": "el-table_5_column_88 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "outsourcing-label",
      "label": "委外标签",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_6_column_89 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "物料",
          "width": 180,
          "classes": "el-table_6_column_90 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "颜色",
          "width": 108,
          "classes": "el-table_6_column_91 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "尺寸",
          "width": 108,
          "classes": "el-table_6_column_92 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "规格参数",
          "width": 108,
          "classes": "el-table_6_column_93 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "类型",
          "width": 80,
          "classes": "el-table_6_column_94 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "订货单",
          "width": 108,
          "classes": "el-table_6_column_95 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "内部单号",
          "width": 108,
          "classes": "el-table_6_column_96 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "任务编号",
          "width": 88,
          "classes": "el-table_6_column_97 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "采购单",
          "width": 108,
          "classes": "el-table_6_column_98 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "产品",
          "width": 200,
          "classes": "el-table_6_column_99 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "备注",
          "width": 148,
          "classes": "el-table_6_column_100 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-12",
          "label": "数量",
          "width": 60,
          "classes": "el-table_6_column_101 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-13",
          "label": "单位",
          "width": 60,
          "classes": "el-table_6_column_102 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-14",
          "label": "采购员",
          "width": 100,
          "classes": "el-table_6_column_103 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-15",
          "label": "创建人",
          "width": 100,
          "classes": "el-table_6_column_104 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-16",
          "label": "采购创建时间",
          "width": 116,
          "classes": "el-table_6_column_105 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-17",
          "label": "到货时间",
          "width": 100,
          "classes": "el-table_6_column_106 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-18",
          "label": "打印状态",
          "width": 90,
          "classes": "el-table_6_column_107 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-19",
          "label": "最近打印时间",
          "width": 116,
          "classes": "el-table_6_column_108 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-20",
          "label": "仓库",
          "width": 80,
          "classes": "el-table_6_column_109 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-21",
          "label": "操作",
          "width": 100,
          "classes": "el-table_6_column_110 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "finished-purchase",
      "label": "成品采购单据",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_7_column_111 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "产品",
          "width": 200,
          "classes": "el-table_7_column_112 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "规格尺寸",
          "width": 92,
          "classes": "el-table_7_column_130 is-center is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "材料/颜色",
          "width": 92,
          "classes": "el-table_7_column_131 is-center is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "皮面",
          "width": 92,
          "classes": "el-table_7_column_181 is-center is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "布面",
          "width": 92,
          "classes": "el-table_7_column_182 is-center is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "大理石",
          "width": 92,
          "classes": "el-table_7_column_183 is-center is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "供应商",
          "width": 120,
          "classes": "el-table_7_column_113 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "数量",
          "width": 70,
          "classes": "el-table_7_column_114 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "单位",
          "width": 60,
          "classes": "el-table_7_column_115 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "单价",
          "width": 80,
          "classes": "el-table_7_column_116 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "合计",
          "width": 80,
          "classes": "el-table_7_column_117 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-12",
          "label": "订货单",
          "width": 150,
          "classes": "el-table_7_column_118 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-13",
          "label": "内部单号",
          "width": 120,
          "classes": "el-table_7_column_119 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-14",
          "label": "采购单",
          "width": 150,
          "classes": "el-table_7_column_120 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-15",
          "label": "产品说明",
          "width": 150,
          "classes": "el-table_7_column_121 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-16",
          "label": "备注",
          "width": 120,
          "classes": "el-table_7_column_122 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-17",
          "label": "采购员",
          "width": 100,
          "classes": "el-table_7_column_123 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-18",
          "label": "采购创建人",
          "width": 100,
          "classes": "el-table_7_column_124 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-19",
          "label": "采购创建时间",
          "width": 160,
          "classes": "el-table_7_column_125 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-20",
          "label": "到货日期",
          "width": 160,
          "classes": "el-table_7_column_126 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-21",
          "label": "打印状态",
          "width": 90,
          "classes": "el-table_7_column_127 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-22",
          "label": "最近打印时间",
          "width": 160,
          "classes": "el-table_7_column_128 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-23",
          "label": "操作",
          "width": 120,
          "classes": "el-table_7_column_129 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "material-purchase",
      "label": "物料采购单据",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_8_column_132 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "物料",
          "width": 200,
          "classes": "el-table_8_column_133 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "颜色",
          "width": 128,
          "classes": "el-table_8_column_134 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "尺寸",
          "width": 128,
          "classes": "el-table_8_column_135 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "规格参数",
          "width": 128,
          "classes": "el-table_8_column_136 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "类型",
          "width": 100,
          "classes": "el-table_8_column_137 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "供应商",
          "width": 120,
          "classes": "el-table_8_column_138 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "数量",
          "width": 70,
          "classes": "el-table_8_column_139 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "单位",
          "width": 60,
          "classes": "el-table_8_column_140 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "单价",
          "width": 80,
          "classes": "el-table_8_column_141 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "合计",
          "width": 80,
          "classes": "el-table_8_column_142 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "物料编号",
          "width": 80,
          "classes": "el-table_8_column_143 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-12",
          "label": "订货单",
          "width": 150,
          "classes": "el-table_8_column_144 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-13",
          "label": "内部单号",
          "width": 120,
          "classes": "el-table_8_column_145 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-14",
          "label": "关联产品",
          "width": 172,
          "classes": "el-table_8_column_146 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-15",
          "label": "采购单",
          "width": 150,
          "classes": "el-table_8_column_147 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-16",
          "label": "备注",
          "width": 120,
          "classes": "el-table_8_column_148 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-17",
          "label": "采购员",
          "width": 100,
          "classes": "el-table_8_column_149 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-18",
          "label": "采购创建人",
          "width": 100,
          "classes": "el-table_8_column_150 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-19",
          "label": "采购创建时间",
          "width": 160,
          "classes": "el-table_8_column_151 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-20",
          "label": "到货日期",
          "width": 160,
          "classes": "el-table_8_column_152 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-21",
          "label": "打印状态",
          "width": 90,
          "classes": "el-table_8_column_153 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-22",
          "label": "最近打印时间",
          "width": 160,
          "classes": "el-table_8_column_154 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-23",
          "label": "操作",
          "width": 120,
          "classes": "el-table_8_column_155 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    },
    {
      "id": "outsourcing-document",
      "label": "委外加工单据",
      "columns": [
        {
          "key": "column-00",
          "label": "",
          "width": 50,
          "classes": "el-table_9_column_156 is-center el-table-column--selection el-table-fixed-column--left is-leaf el-table__cell",
          "sortable": false,
          "fixed": "left",
          "type": "selection"
        },
        {
          "key": "column-01",
          "label": "物料",
          "width": 200,
          "classes": "el-table_9_column_157 el-table-fixed-column--left is-last-column is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": "left",
          "type": "data"
        },
        {
          "key": "column-02",
          "label": "颜色",
          "width": 128,
          "classes": "el-table_9_column_158 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-03",
          "label": "尺寸",
          "width": 128,
          "classes": "el-table_9_column_159 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-04",
          "label": "规格参数",
          "width": 128,
          "classes": "el-table_9_column_160 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-05",
          "label": "类型",
          "width": 100,
          "classes": "el-table_9_column_161 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-06",
          "label": "供应商",
          "width": 120,
          "classes": "el-table_9_column_162 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-07",
          "label": "数量",
          "width": 70,
          "classes": "el-table_9_column_163 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-08",
          "label": "单位",
          "width": 60,
          "classes": "el-table_9_column_164 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-09",
          "label": "单价",
          "width": 80,
          "classes": "el-table_9_column_165 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-10",
          "label": "合计",
          "width": 80,
          "classes": "el-table_9_column_166 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-11",
          "label": "订货单",
          "width": 150,
          "classes": "el-table_9_column_167 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-12",
          "label": "内部单号",
          "width": 120,
          "classes": "el-table_9_column_168 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-13",
          "label": "关联产品",
          "width": 172,
          "classes": "el-table_9_column_169 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-14",
          "label": "产品规格尺寸",
          "width": 92,
          "classes": "el-table_9_column_180 is-center is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-15",
          "label": "产品材料/颜色",
          "width": 92,
          "classes": "el-table_9_column_179 is-center is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-16",
          "label": "采购单",
          "width": 150,
          "classes": "el-table_9_column_170 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-17",
          "label": "备注",
          "width": 120,
          "classes": "el-table_9_column_171 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-18",
          "label": "采购员",
          "width": 100,
          "classes": "el-table_9_column_172 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-19",
          "label": "采购创建人",
          "width": 100,
          "classes": "el-table_9_column_173 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-20",
          "label": "采购创建时间",
          "width": 160,
          "classes": "el-table_9_column_174 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-21",
          "label": "到货日期",
          "width": 160,
          "classes": "el-table_9_column_175 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-22",
          "label": "打印状态",
          "width": 90,
          "classes": "el-table_9_column_176 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-23",
          "label": "最近打印时间",
          "width": 160,
          "classes": "el-table_9_column_177 is-leaf is-sortable el-table__cell",
          "sortable": true,
          "fixed": null,
          "type": "data"
        },
        {
          "key": "column-24",
          "label": "操作",
          "width": 120,
          "classes": "el-table_9_column_178 el-table-fixed-column--right is-first-column is-leaf el-table__cell",
          "sortable": false,
          "fixed": "right",
          "type": "action"
        }
      ]
    }
  ]
}),
    writable: false, configurable: false, enumerable: true
  });
})();
