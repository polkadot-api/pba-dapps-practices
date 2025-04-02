import { Observable, share, Subscription } from "rxjs";

const observable$ = new Observable<number>((subscriber) => {
  let value = 0;
  const token = setInterval(() => {
    subscriber.next(value);
    value++;
  }, 1000);

  return () => {
    clearInterval(token);
  };
});

const map =
  <T, R>(mapValue: (value: T) => R) =>
  (source$: Observable<T>) =>
    new Observable<R>((subscriber) => {
      const subscription = source$.subscribe({
        next(value) {
          subscriber.next(mapValue(value));
        },
        error(err) {
          subscriber.error(err);
        },
        complete() {
          subscriber.complete();
        },
      });

      return () => subscription.unsubscribe();
    });

const switchMap =
  <T, R>(mapFn: (value: T) => Observable<R>) =>
  (source: Observable<T>) =>
    new Observable<R>((subscriber) => {
      let innerSubscription: Subscription | null = null;
      let isOuterComplete = false;
      let isInnerComplete = false;

      const subscription = source.subscribe({
        next: (v) => {
          const innerObservable = mapFn(v);

          innerSubscription?.unsubscribe();
          isInnerComplete = false;
          innerSubscription = innerObservable.subscribe({
            next(value) {
              subscriber.next(value);
            },
            error(err) {
              subscriber.error(err);
            },
            complete() {
              isInnerComplete = true;
              if (isOuterComplete) {
                subscriber.complete();
              }
            },
          });
        },
        error: (e) => subscriber.error(e),
        complete: () => {
          isOuterComplete = true;
          if (isInnerComplete) {
            subscriber.complete();
          }
        },
      });

      return () => {
        innerSubscription?.unsubscribe();
        subscription.unsubscribe();
      };
    });

// const bounty$ = interval(1000).pipe(
//   take(100),
//   switchMap((id) => {
//     return typedApi.query.Bounties.Bounty.watchValue(id);
//   })
// );
