import { databaseToForeignKeys, getQuestion } from "metabase/reference/utils";

import { separateTablesBySchema } from "metabase/reference/databases/TableList";
import { TYPE } from "metabase-lib/lib/types/constants";

describe("Reference utils.js", () => {
  describe("databaseToForeignKeys()", () => {
    it("should build foreignKey viewmodels from database", () => {
      const database = {
        tables_lookup: {
          1: {
            id: 1,
            display_name: "foo",
            schema_name: "PUBLIC",
            fields: [
              {
                id: 1,
                semantic_type: TYPE.PK,
                display_name: "bar",
                description: "foobar",
              },
            ],
          },
          2: {
            id: 2,
            display_name: "bar",
            schema_name: "public",
            fields: [
              {
                id: 2,
                semantic_type: TYPE.PK,
                display_name: "foo",
                description: "barfoo",
              },
            ],
          },
          3: {
            id: 3,
            display_name: "boo",
            schema_name: "TEST",
            fields: [
              {
                id: 3,
                display_name: "boo",
                description: "booboo",
              },
            ],
          },
        },
      };

      const foreignKeys = databaseToForeignKeys(database);

      expect(foreignKeys).toEqual({
        1: { id: 1, name: "Public.foo → bar", description: "foobar" },
        2: { id: 2, name: "bar → foo", description: "barfoo" },
      });
    });
  });

  describe("tablesToSchemaSeparatedTables()", () => {
    it("should add schema separator to appropriate locations", () => {
      const tables = {
        1: { id: 1, name: "table1", schema_name: "foo" },
        2: { id: 2, name: "table2", schema_name: "bar" },
        3: { id: 3, name: "table3", schema_name: "boo" },
        4: { id: 4, name: "table4", schema_name: "bar" },
        5: { id: 5, name: "table5", schema_name: "foo" },
        6: { id: 6, name: "table6", schema_name: "bar" },
      };

      const createSchemaSeparator = table => table.schema_name;
      const createListItem = table => table;

      const schemaSeparatedTables = separateTablesBySchema(
        tables,
        createSchemaSeparator,
        createListItem,
      );

      expect(schemaSeparatedTables).toEqual([
        ["bar", { id: 2, name: "table2", schema_name: "bar" }],
        { id: 4, name: "table4", schema_name: "bar" },
        { id: 6, name: "table6", schema_name: "bar" },
        ["boo", { id: 3, name: "table3", schema_name: "boo" }],
        ["foo", { id: 1, name: "table1", schema_name: "foo" }],
        { id: 5, name: "table5", schema_name: "foo" },
      ]);
    });
  });

  describe("getQuestion()", () => {
    const getNewQuestion = ({
      database = 1,
      table = 2,
      display = "table",
      aggregation,
      breakout,
      filter,
    }) => {
      const card = {
        name: null,
        display: display,
        visualization_settings: {},
        dataset_query: {
          database: database,
          type: "query",
          query: {
            "source-table": table,
          },
        },
      };
      if (aggregation != null) {
        card.dataset_query.query.aggregation = aggregation;
      }
      if (breakout != null) {
        card.dataset_query.query.breakout = breakout;
      }
      if (filter != null) {
        card.dataset_query.query.filter = filter;
      }
      return card;
    };

    it("should generate correct question for table raw data", () => {
      const question = getQuestion({
        dbId: 3,
        tableId: 4,
      });

      expect(question).toEqual(
        getNewQuestion({
          database: 3,
          table: 4,
        }),
      );
    });

    it("should generate correct question for table counts", () => {
      const question = getQuestion({
        dbId: 3,
        tableId: 4,
        getCount: true,
      });

      expect(question).toEqual(
        getNewQuestion({
          database: 3,
          table: 4,
          aggregation: [["count"]],
        }),
      );
    });

    it("should generate correct question for field raw data", () => {
      const question = getQuestion({
        dbId: 3,
        tableId: 4,
        fieldId: 5,
      });

      expect(question).toEqual(
        getNewQuestion({
          database: 3,
          table: 4,
          breakout: [["field", 5, null]],
        }),
      );
    });

    it("should generate correct question for field group by bar chart", () => {
      const question = getQuestion({
        dbId: 3,
        tableId: 4,
        fieldId: 5,
        getCount: true,
        visualization: "bar",
      });

      expect(question).toEqual(
        getNewQuestion({
          database: 3,
          table: 4,
          display: "bar",
          breakout: [["field", 5, null]],
          aggregation: [["count"]],
        }),
      );
    });

    it("should generate correct question for field group by pie chart", () => {
      const question = getQuestion({
        dbId: 3,
        tableId: 4,
        fieldId: 5,
        getCount: true,
        visualization: "pie",
      });

      expect(question).toEqual(
        getNewQuestion({
          database: 3,
          table: 4,
          display: "pie",
          breakout: [["field", 5, null]],
          aggregation: [["count"]],
        }),
      );
    });

    it("should generate correct question for metric raw data", () => {
      const question = getQuestion({
        dbId: 1,
        tableId: 2,
        metricId: 3,
      });

      expect(question).toEqual(
        getNewQuestion({
          aggregation: [["metric", 3]],
        }),
      );
    });

    it("should generate correct question for metric group by fields", () => {
      const question = getQuestion({
        dbId: 1,
        tableId: 2,
        fieldId: 4,
        metricId: 3,
      });

      expect(question).toEqual(
        getNewQuestion({
          aggregation: [["metric", 3]],
          breakout: [["field", 4, null]],
        }),
      );
    });

    it("should generate correct question for segment raw data", () => {
      const question = getQuestion({
        dbId: 2,
        tableId: 3,
        segmentId: 4,
      });

      expect(question).toEqual(
        getNewQuestion({
          database: 2,
          table: 3,
          filter: ["segment", 4],
        }),
      );
    });

    it("should generate correct question for segment counts", () => {
      const question = getQuestion({
        dbId: 2,
        tableId: 3,
        segmentId: 4,
        getCount: true,
      });

      expect(question).toEqual(
        getNewQuestion({
          database: 2,
          table: 3,
          aggregation: [["count"]],
          filter: ["segment", 4],
        }),
      );
    });
  });
});
