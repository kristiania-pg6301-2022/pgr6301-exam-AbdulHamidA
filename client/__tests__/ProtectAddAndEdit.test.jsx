
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { AddNewArticle, EditArticle } from "../components";

const origin =  window.location.origin;
const readerAccount = {email: 'email@email.em', name:'John', google: true}
const writerAccount = {email: 'email@email.em', name:'John'}
describe("List Articles", () => {

      it("ADD article show error when no user logged in", async () => {
        const domElement = document.createElement("div");
        await act(async () => {
          ReactDOM.render(
            <AddNewArticle
             
            />,
            domElement
          );
        });
    
        expect(domElement.querySelector("h1").innerHTML).toEqual(
          "Please Login"
        );
        expect(domElement.innerHTML).toMatchSnapshot();
      });


      it("Edit article show error when no user logged in", async () => {
        const domElement = document.createElement("div");
        await act(async () => {
          ReactDOM.render(
            <EditArticle
             
            />,
            domElement
          );
        });
    
        expect(domElement.querySelector("h1").innerHTML).toEqual(
          "Please Login"
        );
        expect(domElement.innerHTML).toMatchSnapshot();
      });

     

      it("List articles to Edit show error when no user logged in", async () => {
        const domElement = document.createElement("div");
        await act(async () => {
          ReactDOM.render(
            <EditArticle
             
            />,
            domElement
          );
        });
    
        expect(domElement.querySelector("h1").innerHTML).toEqual(
          "Please Login"
        );
        expect(domElement.innerHTML).toMatchSnapshot();
      });

      
});