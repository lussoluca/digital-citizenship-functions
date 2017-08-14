import { IContext } from "@ksjogo/azure-functions-typescript";

export function index(context: IContext) {
  context.log("Node.js queue trigger function processed work item", (context.bindings as any).createdMessage);
  context.log("queueTrigger =", context.bindingData.queueTrigger);
  context.log("expirationTime =", context.bindingData.expirationTime);
  context.log("insertionTime =", context.bindingData.insertionTime);
  context.log("nextVisibleTime =", context.bindingData.nextVisibleTime);
  context.log("id=", context.bindingData.id);
  context.log("popReceipt =", context.bindingData.popReceipt);
  context.log("dequeueCount =", context.bindingData.dequeueCount);
  context.done();
}
