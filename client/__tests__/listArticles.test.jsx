
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { ArticleSingle, MainPage, SidebarApplication,  } from "../components";

const origin =  window.location.origin;
const readerAccount = {email: 'email@email.em', name:'John', google: true}
const writerAccount = {email: 'email@email.em', name:'John'}
describe("List Articles", () => {
    // it("shows loading screen", () => {
    //     const domElement = document.createElement("div");
    //     ReactDOM.render(<MainPage />, domElement);
    //     expect(domElement.innerHTML).toMatchSnapshot();
    // });

    it("shows articles", async () => {
        const articles = [{ title: "article 1", slug: "article-1", _id: 1 }, { title: "article 2", slug: "article-2", _id: 2 }];
        const domElement = document.createElement("div");
        await act(async () => {
          ReactDOM.render(<MainPage articles={articles} />, domElement);
        });
        expect(
            Array.from(domElement.querySelectorAll("a")).map((e) => e.innerHTML)
          ).toEqual(["article 1", "article 2"]);
          expect(
            Array.from(domElement.querySelectorAll("a")).map((e) => e.href)
          ).toEqual([origin+"/view/article-1", origin+"/view/article-2"]);
        expect(domElement.innerHTML).toMatchSnapshot();
      });

      it("shows articles and topics in SidebarApplication", async () => {
        const articles = [{ title: "article 1", slug: "article-1", _id: 1 }, { title: "article 2", slug: "article-2", _id: 2 }];
        const cats = ["Life", "Health"];
        const domElement = document.createElement("div");
        await act(async () => {
          ReactDOM.render(<SidebarApplication articles={articles} cats={cats} />, domElement);
        });
        expect(
            Array.from(domElement.querySelectorAll(".articlessidebar-container a")).map((e) => e.innerHTML)
          ).toEqual(["article 1", "article 2"]);
        expect(
        Array.from(domElement.querySelectorAll(".topics-container a")).map((e) => e.innerHTML)
        ).toEqual(["Life", "Health"]);
        expect(
        Array.from(domElement.querySelectorAll(".articlessidebar-container a")).map((e) => e.href)
        ).toEqual([origin+"/view/article-1",origin+"/view/article-2"]);

        expect(
            Array.from(domElement.querySelectorAll(".topics-container a")).map((e) => e.href)
            ).toEqual([origin+"/topic/Life", origin+"/topic/Health"]);
        expect(domElement.innerHTML).toMatchSnapshot();
      });


      it("show error to not logged in user in article", async () => {
        const domElement = document.createElement("div");
        await act(async () => {
          ReactDOM.render(
            <ArticleSingle
             
            />,
            domElement
          );
        });
    
        expect(domElement.querySelector("h1").innerHTML).toEqual(
          "Please login by google to read the article"
        );
        expect(domElement.innerHTML).toMatchSnapshot();
      });




     
      
});