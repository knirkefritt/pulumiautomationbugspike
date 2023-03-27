import * as express from "express";
import { LocalWorkspace } from "@pulumi/pulumi/automation";

interface ProgramResult {
    summary: {
        endTime: Date;
    }
};

const app = express();
const port = 3001;

const createStackNumberingFunction = (): (() => number) => {
    let i = 1;
    return () => {
        if (i == 3) {
            i = 0;
        }
        return i++;
    };
}
const getStackNumber = createStackNumberingFunction();

const doThePulumiRun = async (alwaysSucceed: boolean): Promise<ProgramResult> => {
    const stackNumber = getStackNumber();

    const stack = await LocalWorkspace.createOrSelectStack({
        stackName: `pulumiautomationbugspike${stackNumber}`,
        projectName: "pulumiautomationbugspike",
        program: async () => {
            if (!alwaysSucceed && stackNumber % 3 == 0) {
                throw new Error("Failing this run");
            }
        },
    });

    try {
        return await stack.up({ onOutput: console.info });
    } catch (error) {
        console.log("Catching the error so that the node process survives");
        return {
            summary: {
                endTime: new Date(),
            },
        }
    }
};

app.get("/faileverythreetimes", async (req, res) => {
    const programResult = await doThePulumiRun(false);    
    res.send({
        programEndDate: programResult.summary.endTime,
    });
});

app.get("/succeed", async (req, res) => {
    const programResult = await doThePulumiRun(true);    
    res.send({
        programEndDate: programResult.summary.endTime,
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
