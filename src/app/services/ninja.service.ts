import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { UtilService } from './util.service';

@Injectable()
export class NinjaService {

  // URL to Ninja API
  ninjaUrl = 'https://mynano.ninja/api/';

  // null - loading, false - offline, true - online
  status = null;

  constructor(private http: HttpClient, private notifications: NotificationService, private util: UtilService) { }

  private async request(action): Promise<any> {
    return await this.http.get(this.ninjaUrl + action).toPromise()
      .then(res => {
        return res;
      })
      .catch(err => {
        return;
      });
  }

  private randomizeByScore(replist: any) {

    const scores = {};
    const newlist = [];

    for (const account of replist) {
      scores[account.weight] = scores[account.weight] || [];
      scores[account.weight].push(account);
    }

    for (const weight in scores) {
      if (scores.hasOwnProperty(weight)) {
        let accounts = scores[weight];
        accounts = this.util.array.shuffle(accounts);

        for (const account of accounts) {
          newlist.unshift(account);
        }
      }
    }

    return newlist;
  }

  async recommended(): Promise<any> {
    return await this.http.post('https://rpc.nano.to', { action: "reps" }).toPromise();
  }

  async recommendedRandomized(): Promise<any> {
    const replist = await this.recommended();
    return this.randomizeByScore(replist);
  }

  async getSuggestedRep(): Promise<any> {
    const replist = await this.recommendedRandomized();
    return replist[0];
  }

  // false - does not exist, null - any other error
  async getAccount(account: string): Promise<any> {
    const REQUEST_TIMEOUT_MS = 10000;

    const successPromise =
      this.http.post('https://rpc.nano.to', { action: "ninja_info", account }).toPromise()
      // this.http.get(this.ninjaUrl + 'accounts/' + account).toPromise()
        .then(res => {
          return res;
        })
        .catch(err => {
          if (err.status === 404) {
            return false;
          }

          return null;
        });

    const timeoutPromise =
      new Promise(resolve => {
        setTimeout(
          () => {
            resolve(null);
          },
          REQUEST_TIMEOUT_MS
        );
      });

    return await Promise.race([
      successPromise,
      timeoutPromise
    ]);
  }

}
