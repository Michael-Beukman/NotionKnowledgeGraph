import { Client, APIErrorCode } from "@notionhq/client";
import fs from 'fs';
import {
  Block,
  Page,
  PageMention,
  RichText,
} from "@notionhq/client/build/src/api-types";
import { RequestParameters } from "@notionhq/client/build/src/Client";
import dotenv from "dotenv";
dotenv.config();
const notion = new Client({
  auth: process.env.NOTION_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;
const database_id = process.env.NOTION_DATABASE_ID!;
console.log({
  databaseId,
});

interface Task {
  Title: string;
  Status: string;
  adjacency: Array<string>;
}

async function get_mentions_from_blocks(block: Block) {
  if (!block) return [];

  const type = block.type;
  const test1: any = block;
  const test: any = test1[type];
  let children: Block[] = test.children;
  const texts: RichText[] = test.text;

  let mentions: Array<PageMention> = [];
  console.log({ children, texts });

  if (block.has_children) {
    const request_payload: RequestParameters = {
      path: "blocks/" + block.id + "/children",
      method: "get",
    };

    const current_pages: any = await notion.request(request_payload);

    children = current_pages.results;
  }

  if (block.has_children && children) {
    for (let c of children) {
      mentions = mentions.concat(await get_mentions_from_blocks(c));
    }
  }

  if (texts) {
    for (let text of texts) {
      if (text.type == "mention") {
        if (text.mention.type == "page") {
          mentions.push(text.mention);
        }
      }
    }
  }
  return mentions;
}

async function main() {
  async function getTasksFromDatabase() {
    const tasks: Record<string, Task> = {};

    async function getPageOfTasks(cursor: any = undefined) {
      let request_payload: RequestParameters = {
        path: "test",
        method: "post",
      };
      // Create the request payload based on the presence of a start_cursor.
      if (cursor == undefined) {
        request_payload = {
          path: "databases/" + database_id + "/query",
          method: "post",
        };
      } else {
        request_payload = {
          path: "databases/" + database_id + "/query",
          method: "post",
          body: {
            start_cursor: cursor,
          },
        };
      }
      // While there are more pages left in the query, get pages from the database.
      const current_pages: any = await notion.request(request_payload);
      const results: Array<Page> = current_pages.results;

      for (const page of results) {
        const name: any = page.properties.Name;
        if (page.properties.Status) {
          const stat: any = page.properties.Status;
          tasks[page.id] = {
            Status: stat.select.name,
            Title: name.title[0].text.content,
            adjacency: [],
          };
        } else {
          tasks[page.id] = {
            Status: "No Status",
            Title: name.title[0].text.content,
            adjacency: [],
          };
        }
      }
      if (current_pages.has_more) {
        await getPageOfTasks(current_pages.next_cursor);
      }
    }
    await getPageOfTasks();
    return tasks;
  }

  const tasks = await getTasksFromDatabase();

  console.log("Got tasks", tasks);
  for (let key in tasks) {
    const request_payload: RequestParameters = {
      path: "blocks/" + key + "/children",
      method: "get",
    };

    const current_pages: any = await notion.request(request_payload);
    const results: Block[] = current_pages.results;
    for (let block of results) {
      let all_mentions: Array<PageMention> = [];

      all_mentions = all_mentions.concat(await get_mentions_from_blocks(block));
      for (let m of all_mentions) {
        const id = m.page.id;
        if (tasks[key].adjacency.indexOf(id) == -1) {
          tasks[key].adjacency.push(id);
          if (!tasks[id]){
            tasks[id] = {
              Title: 'Test',
              'Status': "Test2",
              'adjacency': []
            }
          }
          tasks[id].adjacency.push(key);
        }
      }
    }
  }

  console.log("Got all mentions");
  console.log(tasks);
  fs.writeFile('all_pages.json', JSON.stringify(tasks), 'utf8', ()=>1);
}

// main();
export = main;