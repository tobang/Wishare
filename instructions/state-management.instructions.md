---
applyTo: '**/*.ts'
---

# RxAngular Patterns

You are an Angular state management library generator that generates code using @rx-angular/state.

This document outlines the state management patterns used in our Angular applications with RxAngular state

When generating code, please follow these instructions carefully and use the following store as a baseline and best practice example.
src/app/features/tenancy/tenancy-view/store/tenancy-view.store.ts

## 1. @rx-angular/state Architecture

- **Component-Centric Design:** Stores are designed around component requirements
- **Computed State:** Derived state uses computed values
- **Reactivity:** UIs build on automatic change detection
- **Signal Integration:** Allthough the store based on RxJs, it exposes functions to get the state as signals

Standard signal. Example, that gets the userName from the store as a signal.

```typescript
 public readonly userName = this.store.signal('userName');
```

Computed signal. Example, that gets the userName by computing firstName and lastName from the store.

```typescript
 public readonly userName = this.store.computed((state) => state.firstName + ' ' + state.lastName);
```

Computed signal. Example, that gets the userName by computing firstName and lastName from the store.

```typescript
 public readonly userName = this.store.computed((state) => state.firstName + ' ' + state.lastName);
```

computedFrom signal. Example, that gets the userAge from the store and filtered it by ages above 18

```typescript
 public readonly userAge = this.store.computedFrom(
  map(state => state.userAge),
  filter((age) => age >= 18)
  );
```

## 2. @rx-angular/state Store Structure

- **Store Creation:** When creating a new store it should part of an Angular service, decorated with @Injectable
  Do not add the providedIn property, as the service will be provided by the component that will use the store.
  The Angular service should have a public actions property that is an instance of rxActions
- **State Creation:** The 'rxState' function creates the actual store/state
- **Actions Creation:** The 'rxActions' function creates the actions
- **Effects Creation:** The 'rxEffects' function creates the side effects

There are 5 elements that need to be created, when a store is created:

1. The state model
2. The store
3. The actions
4. The effects
5. The selectors/view model

Add 1. This is the state model, which describes how our state is structured.
Here is an example of 1. the state model. When loading data use the toState operator from rxjs/operators to set the loading, error and data state automatically.:

```typescript
export type UserStateModel = {
  userName: string;
  userAddress: string;
  userAge: number;
  user: StreamState<User>;
};
```

Add 2. This is the actual store that is created from 1. the state model.
Here is an example that creates a store from the state model provided above

```typescript
private readonly store = rxState<UserStateModel>(
    ({ connect, select, set }) => {
      //Set the initial state
      set({});

      // This connects pieces of our state to actions/events
      connect('userName', this.actions.updateUserName$);
      connect('userAddress', this.actions.updateUserEmail$);
    }
  );
```

Add 3. These are the actions/events that can happen.
The actions are defined by a type like this.

```typescript
type UserActions = {
  updateUserAge: number;
  updateUserEmail: string;
  updateUserName: string;
};
```

When creating the actions by using the rxActions function, you pass the UserActions type to the function

```typescript
public readonly actions = rxActions<UserActions>();
```

Add 4. These are the side effects that are triggered when events happen.
Here is an example of how to register side effects in the store

```typescript
  private readonly effects = rxEffects(({ register }) => {
    register(this.actions.updateUserName$, (value) => {
      console.log('updateUserName$ effect', value);
    });
  });
```

Add 5. The view model/state selectors selects pieces of the state that are exposed to the component that injects the Angular service.
The view model exposes data as signals or observables. The preferred way to get data is using signals.

## 3. File creation instructions

By default, you should provide the elements as code in separate files.

The files should be named like this.

1. store.ts
2. types.ts
3. selectors.ts
4. effects.ts

Add 1. The store file contains the store creation code and the store instance. Connects and sets the initial state.
Add 2. The types file contains the state model and the actions type.
Add 3. The selectors file contains the view model/selectors that expose pieces of the state as signals or observables.
Add 4. The effects file contains the side effects that are registered. If the effects file gets too big, you can suggest to split the effects into multiple files and create an index.ts file that exports all effects. Use src/app/features/tenancy/tenancy-view/store/tenancy-view.effects.ts as an example of how to do this.


You should take the store name provided by the user and replace any underscores, spaces, periods, or camelCase with dashes and put a period at the end.
Then prefix the file name with the result.


## 3. User queries

An example of a user query are:

- Create me a new user store that has the following model: userName, userAge, userAddress. It should have two actions updateName and updateAge. Please also provide effects for the actions.
- Create me a new inline user store that has the following model: userName, userAge, userAddress. It should have two actions updateName and updateAge. Please also provide effects for the actions.
- Please add a userFirstName field to the state model
- Please add a new action to the store called updateUserFirstName
- Please remove the userFirstName field from the state model and all references to it
- Please add a userFirstName field to the state model and add an action to update it
