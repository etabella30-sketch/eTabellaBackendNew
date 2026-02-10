import { Injectable, OnModuleInit } from '@nestjs/common';
import * as readline from 'readline';
import { BridgeParseService } from '../../bridge-parse/bridge-parse.service';
import { SessionService } from '../../session/session.service';
import { FeedStartService } from '../feed-start/feed-start.service';

@Injectable()
export class CliService implements OnModuleInit {


  constructor(private readonly bridgeParser: BridgeParseService, private readonly session: SessionService, private readonly feed: FeedStartService) {

  }

  private rl: readline.Interface;

  onModuleInit() {
    // Initialize the readline interface
    // this.rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout,
    // });

    // console.log('CLI is ready. Type a command:');
    // this.prompt();
  }

  prompt() {
    this.rl.prompt();

    this.rl.on('line', (line) => {
      const input = line.trim();

      try {
        const x = input.toUpperCase()
        if (x == 'S') {
          // Lines:${this.session.currentSessionLines}, 
          console.log(`session : ${this.session.currentSessionid}, IsHaveRefrehs:${this.session.currentSessionHaveRefresh}`);
        } else if (x == 'L') {
          console.log(`Current Task ${this.bridgeParser.cmds} / ${this.feed.totalChunks ? this.feed.totalChunks : 'Unknow'}`);
        } else if (x == 'C') {
          console.clear();
        }
      } catch (error) {
        console.log(error);
      }

      // Handle commands
      // if (input === 'exit') {
      //   console.log('Exiting CLI...');
      //   this.rl.close();
      // } else {
      //   console.log(`You entered: ${input}`);
      //   // Process your commands here
      // }

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('CLI closed.');
      process.exit(0);
    });
  }


  async getData(body): Promise<any> {
    const obj = { session: this.session.currentSessionid, IsHaveRefrehs: this.session.currentSessionHaveRefresh, Current_task: this.bridgeParser.cmds, total: (this.feed.totalChunks ? this.feed.totalChunks : 'Unknow') }
    // console.log(obj);
    return obj;
  }
}
