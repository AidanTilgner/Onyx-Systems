import { Router } from "express";
import { AppsPackage, AppsPackageBody } from "../definitions/packages";
import FormData from "form-data";
import axios from "axios";
import multer from "multer";

const router = Router();

const queries: { [key: string]: Function } = {};

const commands: { [key: string]: Function } = {
  display_action_output: (out: any) => {
    console.log("Output:", out);
  },
};

const handlePackage = async (pkg: AppsPackage) => {
  try {
    console.log("Handling package", pkg);
    const { current_step, steps } = pkg;
    const {
      query,
      command,
      deposit,
      data: { deposited },
      next,
    } = steps[current_step];

    let result: { command: string | null; query: string | null } = {
      command: null,
      query: null,
    };
    console.log("Deposited Data:", deposited);

    if (command && commands.hasOwnProperty(command)) {
      const command_result = await commands[command](deposited);
      result.command = command_result;
      steps[current_step].data.gathered = command_result;

      if (deposit >= 0) {
        steps[deposit].data.deposited = command;
      }
    }

    if (query && queries.hasOwnProperty(query)) {
      const query_result = await queries[query](deposited);
      result.query = query_result;
      steps[current_step].data.gathered = query_result;

      if (deposit >= 0) {
        steps[deposit].data.deposited = query_result;
      }
    }

    if (next) {
      return [
        {
          current_step: current_step + 1,
          steps: steps,
        },
        next,
      ];
    }

    return [
      {
        current_step: current_step + 1,
        steps: steps,
      },
      null,
    ];
  } catch (err: any) {
    console.log("Error handling package: ", err);
    pkg.steps[pkg.current_step].errors.push(err);
    if (pkg.steps[pkg.current_step].next) {
      return [
        pkg,
        pkg.steps[pkg.current_step].next,
        `There was an error handling the package: ${err}`,
      ];
    }
    return [pkg, null, `There was an error handling the package: ${err}`];
  }
};

const upload = multer({ dest: "tmp/" });

router.post("/", upload.any(), async (req, res) => {
  try {
    console.log("Receiving package", req.body);
    const { pkg } = req.body as AppsPackageBody;
    const [newPkg, next] = await handlePackage(JSON.parse(pkg));
    const newBody = { pkg: JSON.stringify(newPkg), files: req.files };

    if (!next) {
      return res.send({
        status: "success",
        message: "Package handled successfully",
        result: newPkg,
      });
    }

    const { data } = await axios.post(next + "/package-hook", newBody);

    res.send({
      message: "Successfully handled package",
      result: data,
    });
  } catch (err) {
    console.log("Error in package hook: ", err);
    // TODO: This should just add an error to the body
    return {
      error: "There was an error processing the package",
    };
  }
});

export default router;
