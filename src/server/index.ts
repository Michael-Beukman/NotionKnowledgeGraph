import { Client, APIErrorCode } from "@notionhq/client";
import fs from "fs";
import {
  Block,
  Page,
  PageMention,
  RichText,
} from "@notionhq/client/build/src/api-types";
import { RequestParameters } from "@notionhq/client/build/src/Client";
import dotenv from "dotenv";
dotenv.config();
// get api key from .env
const notion = new Client({
  auth: process.env.NOTION_KEY,
});
// A simple task.
interface Task {
  Title: string;
  Status: string;
  adjacency: Array<string>;
}

/**
 * This returns a list of page mentions found recursively inside this block.
 * @param block The block to get values from recursively
 * @returns Array<PageMention>
 */
async function get_mentions_from_blocks(block: Block) {
  if (!block) return [];

  const type = block.type;
  const test1: any = block;
  const test: any = test1[type];
  let children: Block[] = test.children;
  const texts: RichText[] = test.text;

  let mentions: Array<PageMention> = [];

  if (block.has_children) {
    const request_payload: RequestParameters = {
      path: "blocks/" + block.id + "/children",
      method: "get",
    };

    // You need to get the children using the api again.
    const current_pages: any = await notion.request(request_payload);

    children = current_pages.results;
  }

  if (block.has_children && children) {
    // recursively get mentions from the children.
    for (let c of children) {
      mentions = mentions.concat(await get_mentions_from_blocks(c));
    }
  }

  if (texts) {
    // Find all mentions.
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

async function main(ids: Array<string>) {
  
  /**
   * 
   * @param database_id The DB ID to search through
   * @param tasks The current list of tasks.
   * @returns List of tasks.
   */
  async function getTasksFromDatabase(
    database_id: string,
    tasks: Record<string, Task> = {}
  ) {

    // From Notion API getting started.
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
        const stat: any = page.properties.Status;
        const status = stat ? stat.select.name : "No Status";
        const title = name.title[0].text.content;
        // change name and status if necessary
        if (tasks[page.id]) {
          tasks[page.id].Title = title;
          tasks[page.id].Status = status;
        } else {
          // otherwise add in.
          tasks[page.id] = {
            Status: status,
            Title: title,
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


  // ALl tasks
  let tasks: Record<string, Task> = {};
  // For All DBs, go through it.
  for (let db_id of ids){
    tasks = await getTasksFromDatabase(db_id, tasks);
  }
  for (let key in tasks) {
    // Now, for all pages themselves, go through all of their blocks.
    const request_payload: RequestParameters = {
      path: "blocks/" + key + "/children",
      method: "get",
    };

    const current_pages: any = await notion.request(request_payload);
    const results: Block[] = current_pages.results;
    
    // For all blocks.
    for (let block of results) {
      let all_mentions: Array<PageMention> = [];
      
      // Update the mentions array
      all_mentions = all_mentions.concat(await get_mentions_from_blocks(block));
      
      // for all mentions
      for (let m of all_mentions) {

        // add the adjacency where necessary
        const id = m.page.id;
        // if it doesn't already exist, add it in.
        if (tasks[key].adjacency.indexOf(id) == -1) {
          tasks[key].adjacency.push(id);
          // if the other page does not exist yet, then add it in with a dummy title.
          if (!tasks[id]) {
            tasks[id] = {
              Title: "Test",
              Status: "Test2",
              adjacency: [],
            };
          }
          tasks[id].adjacency.push(key);
        }
      }
    }
  }

  // Write final to a json file for reuse without expensive querying.
  fs.writeFile("all_pages.json", JSON.stringify(tasks), "utf8", () => 1);
}
export = main;
