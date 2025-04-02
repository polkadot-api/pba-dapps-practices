import { Observable, share } from "rxjs";

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

const take =
  <T,>(amount: number) =>
  (source$: Observable<T>) =>
    new Observable<T>((subscriber) => {
      // TODO
    });

const sharedObservable$ = observable$.pipe(
  share(),
  map((x) => x * 2),
  take(5)
);

const subscription = sharedObservable$.subscribe((res) =>
  console.log("A next", res)
);
